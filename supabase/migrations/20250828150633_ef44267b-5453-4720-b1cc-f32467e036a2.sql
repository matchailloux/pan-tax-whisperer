-- Fix remaining security functions with correct digest function
CREATE OR REPLACE FUNCTION public.ff_hash_bucket(seed text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT (abs(('x'||substr(encode(digest(seed, 'sha256'::text), 'hex'), 1, 8))::bit(32)::int) % 100);
$function$;

CREATE OR REPLACE FUNCTION public.set_supplier_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_supplier_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.supplier_order_lines_dual_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.net_unit_price_cents IS NULL AND NEW.unit_price_cents IS NOT NULL THEN
      NEW.net_unit_price_cents := NEW.unit_price_cents;
    ELSIF NEW.unit_price_cents IS NULL AND NEW.net_unit_price_cents IS NOT NULL THEN
      NEW.unit_price_cents := NEW.net_unit_price_cents;
    END IF;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF NEW.net_unit_price_cents IS DISTINCT FROM OLD.net_unit_price_cents AND NEW.unit_price_cents IS NULL THEN
      NEW.unit_price_cents := NEW.net_unit_price_cents;
    ELSIF NEW.unit_price_cents IS DISTINCT FROM OLD.unit_price_cents AND NEW.net_unit_price_cents IS NULL THEN
      NEW.net_unit_price_cents := NEW.unit_price_cents;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_key text, p_business_id uuid DEFAULT NULL::uuid, p_outlet_id uuid DEFAULT NULL::uuid, p_user_seed text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.feature_toggles%rowtype;
  v_seed text; 
  v_bucket int;
BEGIN
  -- Find most specific flag (outlet > business > global)
  SELECT * INTO r
  FROM public.feature_toggles
  WHERE key = p_key
    AND (outlet_id = p_outlet_id OR outlet_id IS NULL)
    AND (business_id = p_business_id OR business_id IS NULL)
  ORDER BY
    CASE WHEN outlet_id IS NOT NULL THEN 0 ELSE 1 END,
    CASE WHEN business_id IS NOT NULL THEN 0 ELSE 1 END
  LIMIT 1;

  IF NOT FOUND OR r.is_enabled = false THEN 
    RETURN false; 
  END IF;

  -- Progressive rollout based on deterministic hash
  v_seed := COALESCE(p_user_seed, p_outlet_id::text, p_business_id::text, 'global') || ':' || p_key;
  v_bucket := public.ff_hash_bucket(v_seed);
  RETURN v_bucket < GREATEST(0, LEAST(100, r.rollout_pct));
END;
$function$;