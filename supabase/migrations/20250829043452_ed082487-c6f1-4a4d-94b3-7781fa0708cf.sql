-- Migration 2: Fix FIRM mode - Add new roles and create tables
-- First add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'FIRM_ADMIN';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ACCOUNTANT';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'CONTRIBUTOR';

-- Add organization type to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS type TEXT 
CHECK (type IN ('INDIVIDUAL', 'FIRM')) 
DEFAULT 'INDIVIDUAL' NOT NULL;

-- Create client_accounts table for FIRM organizations
CREATE TABLE IF NOT EXISTS public.client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  vat_number TEXT,
  country TEXT,
  oss_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, display_name)
);

-- Create invitations table for upload links
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period ~ '^[0-9]{4}-[0-9]{2}$'),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend user_files table for FIRM mode
ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS client_account_id UUID REFERENCES public.client_accounts(id);

ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS period TEXT CHECK (period ~ '^[0-9]{4}-[0-9]{2}$');

-- Extend vat_reports table 
ALTER TABLE public.vat_reports
ADD COLUMN IF NOT EXISTS client_account_id UUID REFERENCES public.client_accounts(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_accounts_org_id ON public.client_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_client_period ON public.invitations(client_account_id, period);
CREATE INDEX IF NOT EXISTS idx_user_files_client_account ON public.user_files(client_account_id);
CREATE INDEX IF NOT EXISTS idx_user_files_period ON public.user_files(period);
CREATE INDEX IF NOT EXISTS idx_vat_reports_client_account ON public.vat_reports(client_account_id);

-- Enable RLS on new tables
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_accounts
CREATE POLICY "Users can view client accounts in their business"
ON public.client_accounts
FOR SELECT
USING (
  organization_id IN (
    SELECT business_id 
    FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create client accounts in their business"
ON public.client_accounts
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT business_id 
    FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('ORG_ADMIN', 'FIRM_ADMIN')
  )
);

CREATE POLICY "Users can update client accounts in their business"
ON public.client_accounts
FOR UPDATE
USING (
  organization_id IN (
    SELECT business_id 
    FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('ORG_ADMIN', 'FIRM_ADMIN')
  )
);

-- RLS policies for invitations
CREATE POLICY "Users can view invitations for their client accounts"
ON public.invitations
FOR SELECT
USING (
  client_account_id IN (
    SELECT ca.id 
    FROM public.client_accounts ca
    JOIN public.memberships m ON m.business_id = ca.organization_id
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create invitations for their client accounts"
ON public.invitations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  client_account_id IN (
    SELECT ca.id 
    FROM public.client_accounts ca
    JOIN public.memberships m ON m.business_id = ca.organization_id
    WHERE m.user_id = auth.uid()
    AND m.role IN ('ORG_ADMIN', 'FIRM_ADMIN', 'ACCOUNTANT')
  )
);

-- Public access for invitation validation (token-based)
CREATE POLICY "Public can validate invitations by token"
ON public.invitations
FOR SELECT
USING (expires_at > NOW() AND used_count < max_uses);

-- Add trigger for updated_at on client_accounts
DROP TRIGGER IF EXISTS update_client_accounts_updated_at ON public.client_accounts;
CREATE TRIGGER update_client_accounts_updated_at
  BEFORE UPDATE ON public.client_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();