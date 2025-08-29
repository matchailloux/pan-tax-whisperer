-- TABLE D'ACTIVITÉ (sans régime TVA) - version adaptée au schéma existant
drop table if exists activity_events_v1;

create table activity_events_v1 (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  client_account_id uuid null,
  upload_id uuid not null,
  event_ts timestamptz not null,
  event_date date not null,
  country text not null,
  currency text not null,
  type text not null check (type in ('SALES','REFUND')),
  sign smallint not null,
  amount_net numeric(18,6) not null,
  amount_tax numeric(18,6) not null,
  amount_gross numeric(18,6) not null,
  vat_rate numeric(9,6) not null,
  vat_rate_pct numeric(5,2) not null,
  amount_bucket text not null,
  created_at timestamptz not null default now(),
  unique (upload_id, event_ts, country, currency, type, amount_gross, amount_tax, amount_net)
);

create index idx_activity_business_client_date
  on activity_events_v1 (business_id, client_account_id, event_date);
create index idx_activity_business_country
  on activity_events_v1 (business_id, country);
create index idx_activity_upload
  on activity_events_v1 (upload_id);

alter table activity_events_v1 enable row level security;

create policy act_sel on activity_events_v1
for select using (
  exists (select 1 from memberships m where m.user_id = auth.uid() and m.business_id = activity_events_v1.business_id)
);

create policy act_ins on activity_events_v1
for insert with check ( auth.role() = 'service_role' );

create policy act_del on activity_events_v1
for delete using ( auth.role() = 'service_role' );

-- Adapter stg_amz_transactions pour utiliser business_id
alter table stg_amz_transactions drop column if exists organization_id;
alter table stg_amz_transactions add column if not exists business_id uuid not null default gen_random_uuid();