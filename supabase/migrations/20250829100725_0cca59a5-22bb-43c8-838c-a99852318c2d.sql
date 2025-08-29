-- Fonctions utilitaires et ingestion
create or replace function norm_country(raw text)
returns text language sql immutable as $$
  select coalesce(nullif(upper(trim(raw)), ''), 'UNKNOWN');
$$;

-- RPC SUMMARY
create or replace function activity_summary(
  p_from date,
  p_to date,
  p_type text default 'BOTH',
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
      and exists (select 1 from memberships m where m.user_id=auth.uid() and m.business_id=a.business_id)
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

-- RPC BREAKDOWN
create or replace function activity_breakdown(
  p_group_by text,
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
      and exists (select 1 from memberships m where m.user_id=auth.uid() and m.business_id=a.business_id)
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
  p_metric text,
  p_interval text,
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
      and exists (select 1 from memberships m where m.user_id=auth.uid() and m.business_id=a.business_id)
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