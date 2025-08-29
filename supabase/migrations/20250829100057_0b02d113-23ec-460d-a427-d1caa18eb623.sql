-- Extensions
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

-- Membres d'organisation (si pas présent)
create table if not exists memberships (
  user_id uuid not null,
  organization_id uuid not null,
  role text not null default 'member',
  primary key (user_id, organization_id)
);
alter table memberships enable row level security;

drop policy if exists p_sel_memberships on memberships;
create policy p_sel_memberships on memberships
for select using (user_id = auth.uid());

-- STAGING (CSV Amazon) — verrouiller fort (front ne lit jamais)
create table if not exists stg_amz_transactions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null,
  organization_id uuid not null,
  client_account_id uuid null,
  TRANSACTION_DEPART_DATE timestamptz,
  TAXABLE_JURISDICTION text,
  TRANSACTION_CURRENCY_CODE text,
  TRANSACTION_TYPE text,
  TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL numeric,
  TOTAL_ACTIVITY_VALUE_VAT_AMT numeric,
  TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL numeric,
  created_at timestamptz default now()
);

alter table stg_amz_transactions enable row level security;

drop policy if exists stg_no_select on stg_amz_transactions;
create policy stg_no_select on stg_amz_transactions
for select using (false); -- lecture impossible via JWT

drop policy if exists stg_ins_service on stg_amz_transactions;
create policy stg_ins_service on stg_amz_transactions
for insert with check ( auth.role() = 'service_role' );

drop policy if exists stg_del_service on stg_amz_transactions;
create policy stg_del_service on stg_amz_transactions
for delete using ( auth.role() = 'service_role' );

-- Normalisation pays
create or replace function norm_country(raw text)
returns text language sql immutable as $$
  select coalesce(nullif(upper(trim(raw)), ''), 'UNKNOWN');
$$;

-- TABLE D'ACTIVITÉ (sans régime TVA)
create table if not exists activity_events_v1 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_account_id uuid null,    -- NULL en INDIVIDUAL
  upload_id uuid not null,
  event_ts timestamptz not null,
  event_date date generated always as (event_ts::date) stored,
  country text not null,
  currency text not null,
  type text not null check (type in ('SALES','REFUND')),
  sign smallint not null,                              -- SALES=+1, REFUND=-1
  amount_net numeric(18,6) not null,                  -- HT signé
  amount_tax numeric(18,6) not null,                  -- TVA signée
  amount_gross numeric(18,6) not null,                -- TTC signé
  vat_rate numeric(9,6) not null,                     -- TVA/HT (0 si HT=0)
  vat_rate_pct numeric(5,2) generated always as (round(vat_rate*100,2)) stored,
  amount_bucket text not null,                        -- buckets TTC absolu
  created_at timestamptz not null default now(),
  unique (upload_id, event_ts, country, currency, type, amount_gross, amount_tax, amount_net)
);

create index if not exists idx_activity_org_client_date
  on activity_events_v1 (organization_id, client_account_id, event_date);
create index if not exists idx_activity_org_country
  on activity_events_v1 (organization_id, country);
create index if not exists idx_activity_upload
  on activity_events_v1 (upload_id);

alter table activity_events_v1 enable row level security;

drop policy if exists act_sel on activity_events_v1;
create policy act_sel on activity_events_v1
for select using (
  exists (select 1 from memberships m where m.user_id = auth.uid() and m.organization_id = activity_events_v1.organization_id)
);

drop policy if exists act_ins on activity_events_v1;
create policy act_ins on activity_events_v1
for insert with check ( auth.role() = 'service_role' );

drop policy if exists act_del on activity_events_v1;
create policy act_del on activity_events_v1
for delete using ( auth.role() = 'service_role' );

-- Ingestion : UPSERT (idempotent)
create or replace function ingest_activity_upsert(p_upload_id uuid)
returns void language sql security definer as $$
with src as (
  select
    s.organization_id,
    s.client_account_id,
    s.upload_id,
    s.TRANSACTION_DEPART_DATE as event_ts,
    norm_country(s.TAXABLE_JURISDICTION) as country,
    upper(s.TRANSACTION_CURRENCY_CODE) as currency,
    case when upper(s.TRANSACTION_TYPE)='REFUND' then 'REFUND' else 'SALES' end as type,
    case when upper(s.TRANSACTION_TYPE)='REFUND' then -1 else 1 end as sign,
    coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL, 0) as amt_excl,
    coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT, 0) as amt_vat,
    coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
             coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0) + coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0)) as amt_incl
  from stg_amz_transactions s
  where s.upload_id = p_upload_id
),
calc as (
  select
    organization_id, client_account_id, upload_id, event_ts, country, currency, type,
    sign,
    (amt_excl * sign)::numeric(18,6) as amount_net,
    (amt_vat  * sign)::numeric(18,6) as amount_tax,
    (amt_incl * sign)::numeric(18,6) as amount_gross,
    case when amt_excl <> 0 then (amt_vat / nullif(amt_excl,0))::numeric(9,6) else 0::numeric(9,6) end as vat_rate
  from src
),
finalized as (
  select
    organization_id, client_account_id, upload_id, event_ts, country, currency, type, sign,
    amount_net, amount_tax, amount_gross, vat_rate,
    case
      when abs(amount_gross) < 20   then '[0–20)'
      when abs(amount_gross) < 50   then '[20–50)'
      when abs(amount_gross) < 100  then '[50–100)'
      when abs(amount_gross) < 250  then '[100–250)'
      when abs(amount_gross) < 500  then '[250–500)'
      when abs(amount_gross) < 1000 then '[500–1000)'
      else '[1000+]'
    end as amount_bucket
  from calc
)
insert into activity_events_v1(
  organization_id, client_account_id, upload_id, event_ts, country, currency,
  type, sign, amount_net, amount_tax, amount_gross, vat_rate, amount_bucket
)
select * from finalized
on conflict (upload_id, event_ts, country, currency, type, amount_gross, amount_tax, amount_net)
do nothing;
$$;

-- Ingestion : REPLACE (purge puis insert)
create or replace function ingest_activity_replace(p_upload_id uuid)
returns void language plpgsql security definer as $$
begin
  delete from activity_events_v1 where upload_id = p_upload_id;

  insert into activity_events_v1(
    organization_id, client_account_id, upload_id, event_ts, country, currency,
    type, sign, amount_net, amount_tax, amount_gross, vat_rate, amount_bucket
  )
  with src as (
    select
      s.organization_id,
      s.client_account_id,
      s.upload_id,
      s.TRANSACTION_DEPART_DATE as event_ts,
      norm_country(s.TAXABLE_JURISDICTION) as country,
      upper(s.TRANSACTION_CURRENCY_CODE) as currency,
      case when upper(s.TRANSACTION_TYPE)='REFUND' then 'REFUND' else 'SALES' end as type,
      case when upper(s.TRANSACTION_TYPE)='REFUND' then -1 else 1 end as sign,
      coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL, 0) as amt_excl,
      coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT, 0) as amt_vat,
      coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
               coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0) + coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0)) as amt_incl
    from stg_amz_transactions s
    where s.upload_id = p_upload_id
  ),
  calc as (
    select
      organization_id, client_account_id, upload_id, event_ts, country, currency, type, sign,
      (amt_excl * sign)::numeric(18,6) as amount_net,
      (amt_vat  * sign)::numeric(18,6) as amount_tax,
      (amt_incl * sign)::numeric(18,6) as amount_gross,
      case when amt_excl <> 0 then (amt_vat / nullif(amt_excl,0))::numeric(9,6) else 0::numeric(9,6) end as vat_rate
    from src
  )
  select
    organization_id, client_account_id, upload_id, event_ts, country, currency, type, sign,
    amount_net, amount_tax, amount_gross, vat_rate,
    case
      when abs(amount_gross) < 20   then '[0–20)'
      when abs(amount_gross) < 50   then '[20–50)'
      when abs(amount_gross) < 100  then '[50–100)'
      when abs(amount_gross) < 250  then '[100–250)'
      when abs(amount_gross) < 500  then '[250–500)'
      when abs(amount_gross) < 1000 then '[500–1000)'
      else '[1000+]'
    end as amount_bucket
  from calc;
end;
$$;

-- RPC SUMMARY
create or replace function activity_summary(
  p_from date,
  p_to date,
  p_type text default 'BOTH',              -- BOTH | SALES | REFUND
  p_country text default null,
  p_include_refunds boolean default true
)
returns table(
  gross_amount numeric,
  tax_amount numeric,
  total_transactions bigint,
  average_sales numeric,
  currency text
)
language sql stable security definer as $$
  with base as (
    select *
    from activity_events_v1 a
    where event_date between p_from and p_to
      and (p_country is null or a.country = upper(p_country))
      and (p_type = 'BOTH' or a.type = p_type)
      and exists (select 1 from memberships m where m.user_id=auth.uid() and m.organization_id=a.organization_id)
  ),
  kpis as (
    select
      sum(case when p_include_refunds then amount_gross
               else case when type='REFUND' then 0 else amount_gross end end) as gross_amount,
      sum(case when p_include_refunds then amount_tax
               else case when type='REFUND' then 0 else amount_tax end end) as tax_amount,
      count(*) filter (where type='SALES') as total_transactions,
      case when count(*) filter (where type='SALES')>0
           then sum(amount_gross) filter (where type='SALES') / (count(*) filter (where type='SALES'))
           else 0 end as average_sales,
      min(currency) as currency
    from base
  )
  select * from kpis;
$$;

-- RPC BREAKDOWN (par pays / type / bucket / taux)
create or replace function activity_breakdown(
  p_group_by text,        -- 'country' | 'type' | 'vat_rate_pct' | 'amount_bucket'
  p_from date,
  p_to date,
  p_type text default 'BOTH'
)
returns table(
  key text,
  gross numeric,
  tax numeric,
  transactions bigint,
  avg_sales numeric
)
language sql stable security definer as $$
  with base as (
    select *
    from activity_events_v1 a
    where event_date between p_from and p_to
      and (p_type = 'BOTH' or a.type = p_type)
      and exists (select 1 from memberships m where m.user_id=auth.uid() and m.organization_id=a.organization_id)
  ),
  g as (
    select
      case
        when p_group_by='country'       then country
        when p_group_by='type'          then type
        when p_group_by='vat_rate_pct'  then vat_rate_pct::text
        when p_group_by='amount_bucket' then amount_bucket
        else 'unknown'
      end as key,
      sum(amount_gross) as gross,
      sum(amount_tax) as tax,
      count(*) filter (where type='SALES') as transactions,
      case when count(*) filter (where type='SALES')>0
           then sum(amount_gross) filter (where type='SALES') / (count(*) filter (where type='SALES'))
           else 0 end as avg_sales
    from base
    group by 1
  )
  select * from g order by gross desc nulls last;
$$;

-- RPC TIMESERIES
create or replace function activity_timeseries(
  p_metric text,          -- 'gross' | 'tax' | 'transactions' | 'aov'
  p_interval text,        -- 'day' | 'week' | 'month' | 'quarter' | 'year'
  p_from date,
  p_to date,
  p_type text default 'BOTH',
  p_group_by_country boolean default false
)
returns table(
  period timestamptz,
  value numeric,
  group_key text
)
language sql stable security definer as $$
  with base as (
    select *
    from activity_events_v1 a
    where event_date between p_from and p_to
      and (p_type = 'BOTH' or a.type = p_type)
      and exists (select 1 from memberships m where m.user_id=auth.uid() and m.organization_id=a.organization_id)
  ),
  t as (
    select
      date_trunc(p_interval, event_ts) as period,
      case
        when p_metric='gross'         then sum(amount_gross)::numeric
        when p_metric='tax'           then sum(amount_tax)::numeric
        when p_metric='transactions'  then count(*) filter (where type='SALES')::numeric
        when p_metric='aov' then
          case when count(*) filter (where type='SALES')>0
               then (sum(amount_gross) filter (where type='SALES'))::numeric / (count(*) filter (where type='SALES'))::numeric
               else 0::numeric end
        else 0::numeric
      end as value,
      case when p_group_by_country then country else null end as group_key
    from base
    group by 1, 3
  )
  select * from t order by period;
$$;

-- STORAGE (bucket privé: financial-uploads)
insert into storage.buckets (id, name, public) 
values ('financial-uploads', 'financial-uploads', false)
on conflict (id) do nothing;

drop policy if exists stor_no_read on storage.objects;
create policy stor_no_read on storage.objects
for select using (false);

drop policy if exists stor_ins_org on storage.objects;
create policy stor_ins_org on storage.objects
for insert with check (
  bucket_id = 'financial-uploads'
  and (storage.foldername(name))[1] = 'org'
  and (storage.foldername(name))[2] in (
     select organization_id::text from memberships where user_id = auth.uid()
  )
);

drop policy if exists stor_del_service on storage.objects;
create policy stor_del_service on storage.objects
for delete using (auth.role() = 'service_role');