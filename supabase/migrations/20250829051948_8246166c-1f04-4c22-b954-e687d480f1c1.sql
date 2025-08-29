-- Migration pour ajouter le contexte client aux fichiers et rapports VAT
-- Ajout de client_account_id aux tables user_files et vat_reports

-- Ajouter la colonne client_account_id à user_files
ALTER TABLE public.user_files 
ADD COLUMN client_account_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE;

-- Ajouter la colonne client_account_id à vat_reports  
ALTER TABLE public.vat_reports 
ADD COLUMN client_account_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE;

-- Créer des index pour optimiser les requêtes par client
CREATE INDEX idx_user_files_client_account ON public.user_files(client_account_id);
CREATE INDEX idx_vat_reports_client_account ON public.vat_reports(client_account_id);
CREATE INDEX idx_user_files_user_client ON public.user_files(user_id, client_account_id);
CREATE INDEX idx_vat_reports_user_client ON public.vat_reports(user_id, client_account_id);

-- Mettre à jour les RLS policies pour user_files pour supporter le contexte multi-client
DROP POLICY IF EXISTS "Users can view their own files" ON public.user_files;
DROP POLICY IF EXISTS "Users can create their own files" ON public.user_files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.user_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.user_files;

-- Nouvelles policies pour user_files avec support multi-client
CREATE POLICY "Users can view their own files and client files" 
ON public.user_files 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (client_account_id IS NOT NULL AND client_account_id IN (
    SELECT ca.id 
    FROM client_accounts ca 
    JOIN memberships m ON m.business_id = ca.organization_id 
    WHERE m.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their own files and client files" 
ON public.user_files 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    client_account_id IS NULL OR 
    client_account_id IN (
      SELECT ca.id 
      FROM client_accounts ca 
      JOIN memberships m ON m.business_id = ca.organization_id 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('ORG_ADMIN', 'FIRM_ADMIN', 'ACCOUNTANT')
    )
  )
);

CREATE POLICY "Users can update their own files and client files" 
ON public.user_files 
FOR UPDATE 
USING (
  auth.uid() = user_id AND (
    client_account_id IS NULL OR 
    client_account_id IN (
      SELECT ca.id 
      FROM client_accounts ca 
      JOIN memberships m ON m.business_id = ca.organization_id 
      WHERE m.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own files and client files" 
ON public.user_files 
FOR DELETE 
USING (
  auth.uid() = user_id AND (
    client_account_id IS NULL OR 
    client_account_id IN (
      SELECT ca.id 
      FROM client_accounts ca 
      JOIN memberships m ON m.business_id = ca.organization_id 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('ORG_ADMIN', 'FIRM_ADMIN', 'ACCOUNTANT')
    )
  )
);

-- Mettre à jour les RLS policies pour vat_reports pour supporter le contexte multi-client
DROP POLICY IF EXISTS "Users can view their own reports" ON public.vat_reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON public.vat_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.vat_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.vat_reports;

-- Nouvelles policies pour vat_reports avec support multi-client
CREATE POLICY "Users can view their own reports and client reports" 
ON public.vat_reports 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (client_account_id IS NOT NULL AND client_account_id IN (
    SELECT ca.id 
    FROM client_accounts ca 
    JOIN memberships m ON m.business_id = ca.organization_id 
    WHERE m.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their own reports and client reports" 
ON public.vat_reports 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    client_account_id IS NULL OR 
    client_account_id IN (
      SELECT ca.id 
      FROM client_accounts ca 
      JOIN memberships m ON m.business_id = ca.organization_id 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('ORG_ADMIN', 'FIRM_ADMIN', 'ACCOUNTANT')
    )
  )
);

CREATE POLICY "Users can update their own reports and client reports" 
ON public.vat_reports 
FOR UPDATE 
USING (
  auth.uid() = user_id AND (
    client_account_id IS NULL OR 
    client_account_id IN (
      SELECT ca.id 
      FROM client_accounts ca 
      JOIN memberships m ON m.business_id = ca.organization_id 
      WHERE m.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own reports and client reports" 
ON public.vat_reports 
FOR DELETE 
USING (
  auth.uid() = user_id AND (
    client_account_id IS NULL OR 
    client_account_id IN (
      SELECT ca.id 
      FROM client_accounts ca 
      JOIN memberships m ON m.business_id = ca.organization_id 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('ORG_ADMIN', 'FIRM_ADMIN', 'ACCOUNTANT')
    )
  )
);

-- Politique pour les invitations publiques afin qu'elles puissent upload via token
CREATE POLICY "Public can upload files via invitation token"
ON public.user_files
FOR INSERT
WITH CHECK (
  client_account_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.client_account_id = user_files.client_account_id
    AND i.expires_at > now()
    AND i.used_count < i.max_uses
  )
);