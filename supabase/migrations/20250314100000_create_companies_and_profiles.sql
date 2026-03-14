-- Faz 1: Şirketler ve kullanıcı profilleri
-- Roller: admin (tüm veri), user/teknisyen (kendi şirketi)

-- Rol enum (opsiyonel; text de kullanılabilir)
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Şirketler tablosu (multi-tenant)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kullanıcı profilleri (auth.users ile 1:1)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role app_role NOT NULL DEFAULT 'user',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Yeni kayıt olan her kullanıcı için profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mevcut auth kullanıcıları için profil (varsa atla, ilk kullanıcı admin)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 'admin'::app_role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.profiles IS 'Supabase Auth kullanıcılarına ait profil ve rol bilgisi';
COMMENT ON TABLE public.companies IS 'Multi-tenant: her firma kendi müşteri verisine sahip';
