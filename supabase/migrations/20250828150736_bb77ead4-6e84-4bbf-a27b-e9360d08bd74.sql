-- Fix remaining security functions with simplified hash approach
CREATE OR REPLACE FUNCTION public.ff_hash_bucket(seed text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  -- Simple hash using built-in hashtext function
  SELECT (abs(hashtext(seed)) % 100);
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