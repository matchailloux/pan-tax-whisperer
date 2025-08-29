-- Créer la table de staging si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.stg_amz_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  client_account_id uuid NULL,
  upload_id uuid NOT NULL,
  TAXABLE_JURISDICTION text,
  TRANSACTION_CURRENCY_CODE text,
  TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL numeric,
  TOTAL_ACTIVITY_VALUE_VAT_AMT numeric,
  TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL numeric,
  TRANSACTION_DEPART_DATE timestamptz,
  TRANSACTION_TYPE text,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table de staging
ALTER TABLE public.stg_amz_transactions ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS stg_no_select ON public.stg_amz_transactions;
DROP POLICY IF EXISTS stg_ins_service ON public.stg_amz_transactions;
DROP POLICY IF EXISTS stg_del_service ON public.stg_amz_transactions;

-- Policies RLS pour staging : lecture interdite, écriture/suppression service role uniquement
CREATE POLICY stg_no_select ON public.stg_amz_transactions 
FOR SELECT USING (false);

CREATE POLICY stg_ins_service ON public.stg_amz_transactions 
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY stg_del_service ON public.stg_amz_transactions 
FOR DELETE USING (auth.role() = 'service_role');

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_stg_amz_upload_id ON public.stg_amz_transactions(upload_id);
CREATE INDEX IF NOT EXISTS idx_stg_amz_org_id ON public.stg_amz_transactions(organization_id);