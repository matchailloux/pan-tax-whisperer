-- Extensions
create extension if not exists pgcrypto;

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
for select using (false);

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
  client_account_id uuid null,
  upload_id uuid not null,
  event_ts timestamptz not null,
  event_date date generated always as (event_ts::date) stored,
  country text not null,
  currency text not null,
  type text not null check (type in ('SALES','REFUND')),
  sign smallint not null,
  amount_net numeric(18,6) not null,
  amount_tax numeric(18,6) not null,
  amount_gross numeric(18,6) not null,
  vat_rate numeric(9,6) not null,
  vat_rate_pct numeric(5,2) generated always as (round(vat_rate*100,2)) stored,
  amount_bucket text not null,
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

-- STORAGE (bucket privé: financial-uploads)
insert into storage.buckets (id, name, public) 
values ('financial-uploads', 'financial-uploads', false)
on conflict (id) do nothing;