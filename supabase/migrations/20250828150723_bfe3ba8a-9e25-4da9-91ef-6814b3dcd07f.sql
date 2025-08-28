-- Fix critical security vulnerabilities (final version)

-- 1. Secure all database functions with proper search_path (if not already set)
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

-- 2. Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "ORG_ADMIN can view audit logs for their business" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create new policies
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

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- 3. Add security trigger for sensitive table access logging
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log access to VAT reports and user files
    IF TG_TABLE_NAME IN ('vat_reports', 'user_files') THEN
        INSERT INTO public.audit_logs (
            user_id, 
            action, 
            table_name, 
            record_id
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_vat_reports ON public.vat_reports;
CREATE TRIGGER audit_vat_reports
    AFTER INSERT OR UPDATE OR DELETE ON public.vat_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

DROP TRIGGER IF EXISTS audit_user_files ON public.user_files;
CREATE TRIGGER audit_user_files
    AFTER INSERT OR UPDATE OR DELETE ON public.user_files
    FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();