-- Fonction exec pour exécuter du SQL dynamique (si elle n'existe pas)
CREATE OR REPLACE FUNCTION public.exec(query text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_catalog
AS $$
BEGIN
  EXECUTE query;
  RETURN 'OK';
EXCEPTION
  WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$;

-- Fonction d'ingestion finale avec gestion d'erreurs améliorée
CREATE OR REPLACE FUNCTION ingest_activity_replace(p_upload_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Supprimer les données existantes pour cet upload
  DELETE FROM activity_events_v1 WHERE upload_id = p_upload_id;

  -- Insérer les nouvelles données traitées
  INSERT INTO activity_events_v1(
    business_id, client_account_id, upload_id, event_ts, event_date, country, currency,
    type, sign, amount_net, amount_tax, amount_gross, vat_rate, vat_rate_pct, amount_bucket
  )
  WITH src AS (
    SELECT
      s.business_id,
      s.client_account_id,
      s.upload_id,
      s.TRANSACTION_DEPART_DATE::timestamptz as event_ts,
      COALESCE(NULLIF(UPPER(TRIM(s.TAXABLE_JURISDICTION)), ''), 'UNKNOWN') as country,
      UPPER(COALESCE(s.TRANSACTION_CURRENCY_CODE, 'EUR')) as currency,
      CASE WHEN UPPER(COALESCE(s.TRANSACTION_TYPE, 'SALES'))='REFUND' THEN 'REFUND' ELSE 'SALES' END as type,
      CASE WHEN UPPER(COALESCE(s.TRANSACTION_TYPE, 'SALES'))='REFUND' THEN -1 ELSE 1 END as sign,
      COALESCE(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL, 0) as amt_excl,
      COALESCE(s.TOTAL_ACTIVITY_VALUE_VAT_AMT, 0) as amt_vat,
      COALESCE(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
               COALESCE(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0) + COALESCE(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0)) as amt_incl
    FROM stg_amz_transactions s
    WHERE s.upload_id = p_upload_id
      AND s.TRANSACTION_DEPART_DATE IS NOT NULL
  ),
  calc AS (
    SELECT
      business_id, client_account_id, upload_id, event_ts, country, currency, type, sign,
      (amt_excl * sign)::numeric(18,6) as amount_net,
      (amt_vat * sign)::numeric(18,6) as amount_tax,
      (amt_incl * sign)::numeric(18,6) as amount_gross,
      CASE WHEN amt_excl <> 0 THEN (amt_vat / NULLIF(amt_excl,0))::numeric(9,6) ELSE 0::numeric(9,6) END as vat_rate
    FROM src
  )
  SELECT
    business_id, client_account_id, upload_id, event_ts, event_ts::date as event_date, 
    country, currency, type, sign, amount_net, amount_tax, amount_gross, vat_rate,
    ROUND(vat_rate * 100, 2) as vat_rate_pct,
    CASE
      WHEN ABS(amount_gross) < 20   THEN '[0–20)'
      WHEN ABS(amount_gross) < 50   THEN '[20–50)'
      WHEN ABS(amount_gross) < 100  THEN '[50–100)'
      WHEN ABS(amount_gross) < 250  THEN '[100–250)'
      WHEN ABS(amount_gross) < 500  THEN '[250–500)'
      WHEN ABS(amount_gross) < 1000 THEN '[500–1000)'
      ELSE '[1000+]'
    END as amount_bucket
  FROM calc;
  
  RAISE NOTICE 'Activity ingestion completed for upload %', p_upload_id;
END;
$$;