-- Fix the user signup trigger to properly handle accountant account type
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Updated function to handle accountant account type properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  business_id_var UUID;
  account_type_var TEXT;
  firm_name_var TEXT;
  firm_address_var TEXT;
BEGIN
  -- Extract metadata
  account_type_var := COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual');
  firm_name_var := NEW.raw_user_meta_data->>'firm_name';
  firm_address_var := NEW.raw_user_meta_data->>'firm_address';

  -- Create business based on account type
  IF account_type_var = 'accountant' THEN
    -- Create FIRM type business for accountants
    INSERT INTO public.businesses (name, type, address)
    VALUES (
      COALESCE(firm_name_var, 'Cabinet de ' || COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
      'FIRM',
      firm_address_var
    )
    RETURNING id INTO business_id_var;
    
    -- Create membership with FIRM_ADMIN role for accountants
    INSERT INTO public.memberships (user_id, business_id, role)
    VALUES (NEW.id, business_id_var, 'FIRM_ADMIN');
  ELSE
    -- Create INDIVIDUAL type business for individual users
    INSERT INTO public.businesses (name, type)
    VALUES (
      'Entreprise de ' || COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur'),
      'INDIVIDUAL'
    )
    RETURNING id INTO business_id_var;
    
    -- Create membership with ORG_ADMIN role for individuals
    INSERT INTO public.memberships (user_id, business_id, role)
    VALUES (NEW.id, business_id_var, 'ORG_ADMIN');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();