-- Restore profile trigger and add separate business setup trigger with safe search_path; also convert your current org to FIRM

-- 1) Drop old single trigger if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profiles ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_business ON auth.users;

-- 2) Recreate original profile/user_settings function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- 3) Create separate business setup function for account type
CREATE OR REPLACE FUNCTION public.handle_new_user_business_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  business_id_var UUID;
  account_type_var TEXT;
  firm_name_var TEXT;
  firm_address_var TEXT;
BEGIN
  account_type_var := COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual');
  firm_name_var := NEW.raw_user_meta_data->>'firm_name';
  firm_address_var := NEW.raw_user_meta_data->>'firm_address';

  IF account_type_var = 'accountant' THEN
    INSERT INTO public.businesses (name, type, description)
    VALUES (
      COALESCE(firm_name_var, 'Cabinet de ' || COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
      'FIRM',
      firm_address_var
    )
    RETURNING id INTO business_id_var;

    INSERT INTO public.memberships (user_id, business_id, role)
    VALUES (NEW.id, business_id_var, 'FIRM_ADMIN');
  ELSE
    INSERT INTO public.businesses (name, type)
    VALUES (
      'Entreprise de ' || COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur'),
      'INDIVIDUAL'
    )
    RETURNING id INTO business_id_var;

    INSERT INTO public.memberships (user_id, business_id, role)
    VALUES (NEW.id, business_id_var, 'ORG_ADMIN');
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Create two triggers so both functions run on signup
CREATE TRIGGER on_auth_user_created_profiles
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_business
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_business_setup();

-- 5) One-off fix: convert the current user's org to FIRM and role to FIRM_ADMIN
DO $$
DECLARE v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mathieu@jourdethe.com';
  IF v_user_id IS NOT NULL THEN
    UPDATE businesses b
      SET type = 'FIRM'
    FROM memberships m
    WHERE m.user_id = v_user_id AND m.business_id = b.id;

    UPDATE memberships
      SET role = 'FIRM_ADMIN'
    WHERE user_id = v_user_id;
  END IF;
END $$;
