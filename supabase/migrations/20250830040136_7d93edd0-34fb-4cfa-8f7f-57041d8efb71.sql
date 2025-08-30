-- Add VAT rate column to staging table
ALTER TABLE stg_amz_transactions
  ADD COLUMN IF NOT EXISTS PRICE_OF_ITEMS_VAT_RATE_PERCENT numeric;

-- Country normalization function
CREATE OR REPLACE FUNCTION norm_country(raw text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(nullif(upper(trim(raw)), ''), 'UNKNOWN');
$$;

-- Sales events table
CREATE TABLE IF NOT EXISTS ventes_events_v1 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  client_account_id uuid NULL,
  upload_id uuid NOT NULL,
  event_ts timestamptz NOT NULL,
  event_date date GENERATED ALWAYS AS (event_ts::date) STORED,
  country text NOT NULL,
  currency text NOT NULL,
  type text NOT NULL CHECK (type IN ('SALE','REFUND','RETURN')),
  sign smallint NOT NULL,
  amount_net numeric(18,6) NOT NULL,
  amount_tax numeric(18,6) NOT NULL,
  amount_gross numeric(18,6) NOT NULL,
  vat_rate_pct numeric(5,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (upload_id, event_ts, country, currency, type, amount_gross, amount_tax, amount_net)
);

ALTER TABLE ventes_events_v1 ENABLE ROW LEVEL SECURITY;

-- RLS policies for ventes_events_v1
CREATE POLICY "Users can view sales events in their organization" 
ON ventes_events_v1 FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM memberships m 
  WHERE m.user_id = auth.uid() 
  AND m.business_id = ventes_events_v1.organization_id
));

CREATE POLICY "Service role can insert sales events" 
ON ventes_events_v1 FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can delete sales events" 
ON ventes_events_v1 FOR DELETE 
USING (auth.role() = 'service_role'::text);

-- Sales ingestion function
CREATE OR REPLACE FUNCTION ingest_ventes_replace(p_upload_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM ventes_events_v1 WHERE upload_id = p_upload_id;

  INSERT INTO ventes_events_v1(
    organization_id, client_account_id, upload_id, event_ts, country, currency,
    type, sign, amount_net, amount_tax, amount_gross, vat_rate_pct
  )
  WITH src AS (
    SELECT
      s.organization_id,
      s.client_account_id,
      s.upload_id,
      s.TRANSACTION_DEPART_DATE::timestamptz as event_ts,
      norm_country(s.TAXABLE_JURISDICTION) as country,
      upper(nullif(trim(s.TRANSACTION_CURRENCY_CODE),'')) as currency,
      CASE
        WHEN upper(s.TRANSACTION_TYPE) IN ('REFUND','RETURN') THEN upper(s.TRANSACTION_TYPE)
        WHEN upper(s.TRANSACTION_TYPE) = 'SALES' THEN 'SALE'
        ELSE 'SALE'
      END as type_norm,
      abs(coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0)) as amt_excl_abs,
      abs(coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0)) as amt_vat_abs,
      abs(coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
                   coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0) + coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0))) as amt_incl_abs,
      s.PRICE_OF_ITEMS_VAT_RATE_PERCENT as vat_rate_pct_src
    FROM stg_amz_transactions s
    WHERE s.upload_id = p_upload_id
  ),
  norm AS (
    SELECT
      organization_id, client_account_id, upload_id, event_ts, country,
      coalesce(currency,'EUR') as currency,
      type_norm as type,
      CASE WHEN type_norm IN ('REFUND','RETURN') THEN -1 ELSE 1 END as sign,
      amt_excl_abs, amt_vat_abs, amt_incl_abs,
      coalesce(nullif(vat_rate_pct_src,0),
               CASE WHEN amt_excl_abs <> 0 THEN round((amt_vat_abs/amt_excl_abs)*100,2) ELSE 0 END
      )::numeric(5,2) as vat_rate_pct
    FROM src
  )
  SELECT
    organization_id, client_account_id, upload_id, event_ts, country, currency,
    type, sign,
    (amt_excl_abs * sign)::numeric(18,6),
    (amt_vat_abs * sign)::numeric(18,6),
    (amt_incl_abs * sign)::numeric(18,6),
    vat_rate_pct
  FROM norm;
END;
$$;

-- Sales KPIs function
CREATE OR REPLACE FUNCTION ventes_kpis(
  p_from date,
  p_to date,
  p_currency text DEFAULT 'EUR',
  p_country text DEFAULT NULL,
  p_type text DEFAULT 'ALL',
  p_include_negatives boolean DEFAULT true
)
RETURNS TABLE(
  gross_ttc numeric,
  net_ht numeric,
  tax_tva numeric,
  transactions_total bigint,
  sales_count bigint,
  refund_count bigint,
  return_count bigint,
  currency text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT * FROM ventes_events_v1 a
    WHERE event_date BETWEEN p_from AND p_to
      AND (p_currency IS NULL OR a.currency = upper(p_currency))
      AND (p_country IS NULL OR a.country = upper(p_country))
      AND (p_type = 'ALL' OR a.type = upper(p_type))
      AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.business_id = a.organization_id)
  ),
  adj AS (
    SELECT
      CASE WHEN p_include_negatives THEN amount_gross ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_gross END END as gross_eff,
      CASE WHEN p_include_negatives THEN amount_net ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_net END END as net_eff,
      CASE WHEN p_include_negatives THEN amount_tax ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_tax END END as tax_eff,
      type, currency
    FROM base
  )
  SELECT
    sum(gross_eff), sum(net_eff), sum(tax_eff),
    count(*),
    count(*) FILTER (WHERE type = 'SALE'),
    count(*) FILTER (WHERE type = 'REFUND'),
    count(*) FILTER (WHERE type = 'RETURN'),
    min(currency)
  FROM adj;
$$;

-- Sales totals by country
CREATE OR REPLACE FUNCTION ventes_country_totals(
  p_from date,
  p_to date,
  p_currency text DEFAULT 'EUR',
  p_type text DEFAULT 'ALL',
  p_include_negatives boolean DEFAULT true
)
RETURNS TABLE(
  country text,
  currency text,
  gross_ttc numeric,
  net_ht numeric,
  tax_tva numeric,
  sales_count bigint,
  refund_count bigint,
  return_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT * FROM ventes_events_v1 a
    WHERE event_date BETWEEN p_from AND p_to
      AND (p_currency IS NULL OR a.currency = upper(p_currency))
      AND (p_type = 'ALL' OR a.type = upper(p_type))
      AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.business_id = a.organization_id)
  ),
  adj AS (
    SELECT
      country, currency,
      CASE WHEN p_include_negatives THEN amount_gross ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_gross END END as gross_eff,
      CASE WHEN p_include_negatives THEN amount_net ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_net END END as net_eff,
      CASE WHEN p_include_negatives THEN amount_tax ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_tax END END as tax_eff,
      type
    FROM base
  )
  SELECT
    country, min(currency) as currency,
    sum(gross_eff) as gross_ttc,
    sum(net_eff) as net_ht,
    sum(tax_eff) as tax_tva,
    count(*) FILTER (WHERE type = 'SALE') as sales_count,
    count(*) FILTER (WHERE type = 'REFUND') as refund_count,
    count(*) FILTER (WHERE type = 'RETURN') as return_count
  FROM adj
  GROUP BY country
  ORDER BY gross_ttc DESC NULLS LAST;
$$;

-- Sales totals by country and VAT rate
CREATE OR REPLACE FUNCTION ventes_country_vat_rate_totals(
  p_from date,
  p_to date,
  p_currency text DEFAULT 'EUR',
  p_type text DEFAULT 'ALL',
  p_include_negatives boolean DEFAULT true
)
RETURNS TABLE(
  country text,
  vat_rate_pct numeric,
  currency text,
  gross_ttc numeric,
  net_ht numeric,
  tax_tva numeric,
  sales_count bigint,
  refund_count bigint,
  return_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT * FROM ventes_events_v1 a
    WHERE event_date BETWEEN p_from AND p_to
      AND (p_currency IS NULL OR a.currency = upper(p_currency))
      AND (p_type = 'ALL' OR a.type = upper(p_type))
      AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.business_id = a.organization_id)
  ),
  adj AS (
    SELECT
      country, vat_rate_pct, currency,
      CASE WHEN p_include_negatives THEN amount_gross ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_gross END END as gross_eff,
      CASE WHEN p_include_negatives THEN amount_net ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_net END END as net_eff,
      CASE WHEN p_include_negatives THEN amount_tax ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_tax END END as tax_eff,
      type
    FROM base
  )
  SELECT
    country, vat_rate_pct, min(currency),
    sum(gross_eff), sum(net_eff), sum(tax_eff),
    count(*) FILTER (WHERE type = 'SALE'),
    count(*) FILTER (WHERE type = 'REFUND'),
    count(*) FILTER (WHERE type = 'RETURN')
  FROM adj
  GROUP BY country, vat_rate_pct
  ORDER BY country, vat_rate_pct;
$$;

-- Sales time series
CREATE OR REPLACE FUNCTION ventes_timeseries(
  p_metric text,
  p_interval text,
  p_from date,
  p_to date,
  p_currency text DEFAULT 'EUR',
  p_type text DEFAULT 'ALL',
  p_include_negatives boolean DEFAULT true
)
RETURNS TABLE(
  period timestamptz,
  value numeric
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT * FROM ventes_events_v1 a
    WHERE event_date BETWEEN p_from AND p_to
      AND (p_currency IS NULL OR a.currency = upper(p_currency))
      AND (p_type = 'ALL' OR a.type = upper(p_type))
      AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.business_id = a.organization_id)
  ),
  adj AS (
    SELECT
      date_trunc(p_interval, event_ts) as period,
      CASE WHEN p_include_negatives THEN amount_gross ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_gross END END as gross_eff,
      CASE WHEN p_include_negatives THEN amount_net ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_net END END as net_eff,
      CASE WHEN p_include_negatives THEN amount_tax ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_tax END END as tax_eff
    FROM base
  )
  SELECT
    period,
    CASE
      WHEN p_metric = 'gross' THEN sum(gross_eff)::numeric
      WHEN p_metric = 'net' THEN sum(net_eff)::numeric
      WHEN p_metric = 'tax' THEN sum(tax_eff)::numeric
      WHEN p_metric = 'transactions' THEN count(*)::numeric
      ELSE 0::numeric
    END as value
  FROM adj
  GROUP BY period
  ORDER BY period;
$$;

-- Sales breakdown by type
CREATE OR REPLACE FUNCTION ventes_breakdown_type(
  p_from date,
  p_to date,
  p_currency text DEFAULT 'EUR',
  p_include_negatives boolean DEFAULT true
)
RETURNS TABLE(
  type text,
  gross_ttc numeric,
  net_ht numeric,
  tax_tva numeric,
  count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH base AS (
    SELECT * FROM ventes_events_v1 a
    WHERE event_date BETWEEN p_from AND p_to
      AND (p_currency IS NULL OR a.currency = upper(p_currency))
      AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.business_id = a.organization_id)
  ),
  adj AS (
    SELECT
      type,
      CASE WHEN p_include_negatives THEN amount_gross ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_gross END END as gross_eff,
      CASE WHEN p_include_negatives THEN amount_net ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_net END END as net_eff,
      CASE WHEN p_include_negatives THEN amount_tax ELSE CASE WHEN sign < 0 THEN 0 ELSE amount_tax END END as tax_eff
    FROM base
  )
  SELECT
    type,
    sum(gross_eff), sum(net_eff), sum(tax_eff), count(*)
  FROM adj
  GROUP BY type
  ORDER BY type;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS ix_ventes_events_v1_date ON ventes_events_v1(event_date);
CREATE INDEX IF NOT EXISTS ix_ventes_events_v1_country ON ventes_events_v1(country);
CREATE INDEX IF NOT EXISTS ix_ventes_events_v1_currency ON ventes_events_v1(currency);
CREATE INDEX IF NOT EXISTS ix_ventes_events_v1_type ON ventes_events_v1(type);
CREATE INDEX IF NOT EXISTS ix_ventes_events_v1_upload ON ventes_events_v1(upload_id);
CREATE INDEX IF NOT EXISTS ix_ventes_events_v1_org ON ventes_events_v1(organization_id);