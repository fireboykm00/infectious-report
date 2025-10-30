-- ============================================================================
-- IDSR Safe / Idempotent Database Setup (Reordered)
-- Paste into Supabase SQL Editor and run
-- ============================================================================

-- Ensure uuid extension available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) ENUM types (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'reporter',
      'lab_tech',
      'district_officer',
      'national_officer',
      'admin'
    );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'app_role type exists or creation failed: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
    CREATE TYPE public.case_status AS ENUM (
      'suspected',
      'confirmed',
      'ruled_out',
      'pending_lab'
    );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'case_status type exists or creation failed: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outbreak_status') THEN
    CREATE TYPE public.outbreak_status AS ENUM (
      'active',
      'monitoring',
      'resolved'
    );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'outbreak_status type exists or creation failed: %', SQLERRM;
END$$;

-- 2) Tables (dependency-ordered)

-- districts (no FK dependencies)
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  province TEXT,
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- facilities (depends on districts)
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_id UUID REFERENCES public.districts(id),
  type TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- disease_codes (independent)
CREATE TABLE IF NOT EXISTS public.disease_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  symptoms TEXT[],
  is_notifiable BOOLEAN DEFAULT true,
  alert_threshold INTEGER,
  threshold_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles (references auth.users and facilities)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_roles (references auth.users)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- case_reports (references disease_codes, facilities, districts, auth.users)
CREATE TABLE IF NOT EXISTS public.case_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  district_id UUID REFERENCES public.districts(id),
  disease_code TEXT REFERENCES public.disease_codes(code),
  age_group TEXT,
  gender TEXT,
  symptoms TEXT,
  status public.case_status DEFAULT 'suspected',
  location_detail TEXT,
  notes TEXT,
  attachments JSONB,
  client_local_id TEXT,
  sync_status TEXT,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- lab_results (references case_reports, auth.users, facilities)
CREATE TABLE IF NOT EXISTS public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_report_id UUID REFERENCES public.case_reports(id),
  test_type TEXT NOT NULL,
  result TEXT NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL,
  lab_technician_id UUID REFERENCES auth.users(id),
  lab_facility_id UUID REFERENCES public.facilities(id),
  notes TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- outbreaks (references disease_codes, auth.users)
CREATE TABLE IF NOT EXISTS public.outbreaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_code TEXT REFERENCES public.disease_codes(code),
  location TEXT,
  affected_districts UUID[] DEFAULT ARRAY[]::uuid[],
  case_count INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status public.outbreak_status DEFAULT 'active',
  response_actions JSONB,
  declared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Enable RLS on selected tables (safe)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.outbreaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disease_codes ENABLE ROW LEVEL SECURITY;

-- 4) RLS policies (create only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'profiles' AND n.nspname = 'public') THEN
    DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
    CREATE POLICY profiles_select_own ON public.profiles
      FOR SELECT USING ((SELECT auth.uid()) = id);

    DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE USING ((SELECT auth.uid()) = id)
      WITH CHECK ((SELECT auth.uid()) = id);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'user_roles' AND n.nspname = 'public') THEN
    DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
    CREATE POLICY user_roles_select_own ON public.user_roles
      FOR SELECT USING ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS user_roles_admin ON public.user_roles;
    CREATE POLICY user_roles_admin ON public.user_roles
      FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'disease_codes' AND n.nspname = 'public') THEN
    DROP POLICY IF EXISTS disease_codes_public_select ON public.disease_codes;
    CREATE POLICY disease_codes_public_select ON public.disease_codes
      FOR SELECT TO authenticated USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'case_reports' AND n.nspname = 'public') THEN
    DROP POLICY IF EXISTS case_reports_select_auth ON public.case_reports;
    CREATE POLICY case_reports_select_auth ON public.case_reports
      FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS case_reports_insert_auth ON public.case_reports;
    CREATE POLICY case_reports_insert_auth ON public.case_reports
      FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = reporter_id);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'lab_results' AND n.nspname = 'public') THEN
    DROP POLICY IF EXISTS lab_results_insert_auth ON public.lab_results;
    CREATE POLICY lab_results_insert_auth ON public.lab_results
      FOR INSERT TO authenticated WITH CHECK (true);

    DROP POLICY IF EXISTS lab_results_select_auth ON public.lab_results;
    CREATE POLICY lab_results_select_auth ON public.lab_results
      FOR SELECT TO authenticated USING (true);
  END IF;
END$$;

-- 5) Insert initial data (idempotent)
INSERT INTO public.districts (name, province, population)
VALUES
  ('Gasabo', 'Kigali City', 530907),
  ('Kicukiro', 'Kigali City', 318787),
  ('Nyarugenge', 'Kigali City', 284561)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.disease_codes (code, name, description, symptoms, is_notifiable)
VALUES
  ('CHOL', 'Cholera', 'Acute watery diarrhea', ARRAY['acute_watery_diarrhea','vomiting','dehydration'], true),
  ('MEAS', 'Measles', 'Highly contagious viral disease', ARRAY['fever','rash','cough','conjunctivitis'], true),
  ('COVID', 'COVID-19', 'Coronavirus disease', ARRAY['fever','cough','breathing_difficulty','loss_of_taste_smell'], true),
  ('MALA', 'Malaria', 'Mosquito-borne disease', ARRAY['fever','chills','headache','nausea'], true),
  ('EBOLA', 'Ebola Virus Disease', 'Severe hemorrhagic fever', ARRAY['fever','severe_headache','muscle_pain','vomiting','bleeding'], true)
ON CONFLICT (code) DO NOTHING;

-- 6) Helper function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers (safe, check existence first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
    CREATE TRIGGER profiles_set_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_roles') THEN
    DROP TRIGGER IF EXISTS user_roles_set_updated_at ON public.user_roles;
    CREATE TRIGGER user_roles_set_updated_at
      BEFORE UPDATE ON public.user_roles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='case_reports') THEN
    DROP TRIGGER IF EXISTS case_reports_set_updated_at ON public.case_reports;
    CREATE TRIGGER case_reports_set_updated_at
      BEFORE UPDATE ON public.case_reports
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lab_results') THEN
    DROP TRIGGER IF EXISTS lab_results_set_updated_at ON public.lab_results;
    CREATE TRIGGER lab_results_set_updated_at
      BEFORE UPDATE ON public.lab_results
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='outbreaks') THEN
    DROP TRIGGER IF EXISTS outbreaks_set_updated_at ON public.outbreaks;
    CREATE TRIGGER outbreaks_set_updated_at
      BEFORE UPDATE ON public.outbreaks
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- ============================================================================
-- Done. Run the script whole in the SQL editor. If you see any errors during execution,
-- share the error message and I will pinpoint and fix the failing statement.
-- ============================================================================