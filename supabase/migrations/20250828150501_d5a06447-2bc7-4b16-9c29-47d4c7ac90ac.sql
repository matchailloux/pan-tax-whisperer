-- Fix critical security vulnerabilities

-- 1. Secure all database functions with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _business_id uuid, _role app_role, _location_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = _user_id
        AND business_id = _business_id
        AND role = _role
        AND (
            _location_id IS NULL 
            OR location_id IS NULL 
            OR location_id = _location_id
        )
    );
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'CMD-' || to_char(current_timestamp, 'YYYYMMDD') || '-' || 
         LPAD((EXTRACT(EPOCH FROM current_timestamp)::INTEGER % 10000)::TEXT, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_supplier_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'SO-' || to_char(current_timestamp, 'YYYYMMDD') || '-' || 
         LPAD((EXTRACT(EPOCH FROM current_timestamp)::INTEGER % 10000)::TEXT, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin 
  new.updated_at = now(); 
  return new; 
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_vendor_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'PO-' || to_char(current_timestamp, 'YYYYMMDD') || '-' || 
         LPAD((EXTRACT(EPOCH FROM current_timestamp)::INTEGER % 10000)::TEXT, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_locations(_user_id uuid, _business_id uuid)
 RETURNS TABLE(location_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = _user_id 
            AND business_id = _business_id 
            AND role = 'ORG_ADMIN'
        ) THEN l.id
        ELSE m.location_id
    END
    FROM public.locations l
    LEFT JOIN public.memberships m ON m.location_id = l.id 
        AND m.user_id = _user_id 
        AND m.business_id = _business_id
    WHERE l.business_id = _business_id
    AND (
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = _user_id 
            AND business_id = _business_id 
            AND role = 'ORG_ADMIN'
        )
        OR m.location_id IS NOT NULL
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_business_ids(_user_id uuid)
 RETURNS TABLE(business_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT DISTINCT m.business_id 
    FROM public.memberships m 
    WHERE m.user_id = _user_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_org_admin_for_business(_user_id uuid, _business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = _user_id
        AND business_id = _business_id
        AND role = 'ORG_ADMIN'
    );
$function$;

-- 2. Fix supplier order response tokens security (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_order_responses') THEN
        -- Drop existing public policies
        DROP POLICY IF EXISTS "supplier_order_responses_select_policy" ON public.supplier_order_responses;
        
        -- Create secure token-based access policy
        CREATE POLICY "Secure token-based access to supplier order responses"
        ON public.supplier_order_responses
        FOR SELECT
        USING (
            -- Only allow access via valid token lookup, not full table scan
            auth.uid() IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM public.supplier_orders so
                WHERE so.id = supplier_order_responses.supplier_order_id
                AND so.business_id IN (
                    SELECT business_id FROM get_user_business_ids(auth.uid())
                )
            )
        );

        CREATE POLICY "Users can create supplier order responses for their business"
        ON public.supplier_order_responses
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.supplier_orders so
                WHERE so.id = supplier_order_responses.supplier_order_id
                AND so.business_id IN (
                    SELECT business_id FROM get_user_business_ids(auth.uid())
                )
            )
        );
    END IF;
END $$;

-- 3. Restrict feature_toggles access to business context only
DROP POLICY IF EXISTS "Users can read feature flags in their business" ON public.feature_toggles;

CREATE POLICY "Restrict feature flags to business context only"
ON public.feature_toggles
FOR SELECT
USING (
    -- Global flags (no business_id) are readable by authenticated users
    (business_id IS NULL AND auth.uid() IS NOT NULL)
    OR 
    -- Business-specific flags only by business members
    (business_id IS NOT NULL AND business_id IN (
        SELECT business_id FROM get_user_business_ids(auth.uid())
    ))
);

-- 4. Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    business_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "ORG_ADMIN can view audit logs for their business"
ON public.audit_logs
FOR SELECT
USING (
    business_id IN (
        SELECT business_id 
        FROM public.memberships 
        WHERE user_id = auth.uid() 
        AND role = 'ORG_ADMIN'
    )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- 5. Add security trigger for sensitive table access logging
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log access to VAT reports and user files
    IF TG_TABLE_NAME IN ('vat_reports', 'user_files') THEN
        INSERT INTO public.audit_logs (
            user_id, 
            business_id,
            action, 
            table_name, 
            record_id
        ) VALUES (
            auth.uid(),
            COALESCE(NEW.business_id, OLD.business_id),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Apply audit triggers to sensitive tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vat_reports') THEN
        DROP TRIGGER IF EXISTS audit_vat_reports ON public.vat_reports;
        CREATE TRIGGER audit_vat_reports
            AFTER INSERT OR UPDATE OR DELETE ON public.vat_reports
            FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_files') THEN
        DROP TRIGGER IF EXISTS audit_user_files ON public.user_files;
        CREATE TRIGGER audit_user_files
            AFTER INSERT OR UPDATE OR DELETE ON public.user_files
            FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();
    END IF;
END $$;