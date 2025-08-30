-- Fix ventes ingestion to use business_id when organization_id is missing in staging
CREATE OR REPLACE FUNCTION public.ingest_ventes_replace(p_upload_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Remove existing events for this upload
  DELETE FROM ventes_events_v1 WHERE upload_id = p_upload_id;

  -- Insert normalized rows
  INSERT INTO ventes_events_v1(
    organization_id, client_account_id, upload_id, event_ts, event_date, country, currency,
    type, sign, amount_net, amount_tax, amount_gross, vat_rate_pct
  )
  WITH src AS (
    SELECT
      COALESCE(s.organization_id, s.business_id) AS organization_id,
      s.client_account_id,
      s.upload_id,
      s.TRANSACTION_DEPART_DATE::timestamptz AS event_ts,
      norm_country(s.TAXABLE_JURISDICTION) AS country,
      upper(nullif(trim(s.TRANSACTION_CURRENCY_CODE),'')) AS currency,
      CASE
        WHEN upper(s.TRANSACTION_TYPE) IN ('REFUND','RETURN') THEN upper(s.TRANSACTION_TYPE)
        WHEN upper(s.TRANSACTION_TYPE) IN ('SALES','SALE') THEN 'SALE'
        ELSE 'SALE'
      END AS type_norm,
      abs(coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0)) AS amt_excl_abs,
      abs(coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0)) AS amt_vat_abs,
      abs(coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
                   coalesce(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0) + coalesce(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0))) AS amt_incl_abs,
      nullif(s.PRICE_OF_ITEMS_VAT_RATE_PERCENT,0) AS vat_rate_pct_src
    FROM stg_amz_transactions s
    WHERE s.upload_id = p_upload_id
  ),
  norm AS (
    SELECT
      organization_id, client_account_id, upload_id, event_ts, country,
      coalesce(currency,'EUR') AS currency,
      type_norm AS type,
      CASE WHEN type_norm IN ('REFUND','RETURN') THEN -1 ELSE 1 END AS sign,
      amt_excl_abs, amt_vat_abs, amt_incl_abs,
      coalesce(vat_rate_pct_src,
               CASE WHEN amt_excl_abs <> 0 THEN round((amt_vat_abs/amt_excl_abs)*100,2) ELSE 0 END
      )::numeric(5,2) AS vat_rate_pct
    FROM src
  )
  SELECT
    organization_id, client_account_id, upload_id, event_ts, event_ts::date AS event_date, country, currency,
    type, sign,
    (amt_excl_abs * sign)::numeric(18,6),
    (amt_vat_abs * sign)::numeric(18,6),
    (amt_incl_abs * sign)::numeric(18,6),
    vat_rate_pct
  FROM norm;

  RAISE NOTICE 'Ventes ingestion completed for upload %', p_upload_id;
END;
$function$;