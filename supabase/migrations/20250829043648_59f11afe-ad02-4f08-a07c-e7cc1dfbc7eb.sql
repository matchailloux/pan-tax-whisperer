-- Migration 5: Add RLS policies for FIRM tables
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