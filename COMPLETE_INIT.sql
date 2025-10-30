-- ============================================================================
-- COMPLETE DATABASE INITIALIZATION (Run in Supabase SQL Editor)
-- ============================================================================
-- This script:
-- 1. Creates all tables (idempotent)
-- 2. Inserts reference data (districts, facilities, diseases)
-- 3. Creates your admin user profile and role
-- ============================================================================

-- STEP 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: CREATE ENUMS (if not exists)
-- ============================================================================

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
  RAISE NOTICE 'app_role type exists';
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
  RAISE NOTICE 'case_status type exists';
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
  RAISE NOTICE 'outbreak_status type exists';
END$$;

-- ============================================================================
-- STEP 3: CREATE TABLES (in dependency order)
-- ============================================================================

-- Districts (no dependencies)
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  province TEXT,
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities (depends on districts)
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

-- Disease codes (independent)
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

-- Profiles (references auth.users and facilities)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles (references auth.users)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case reports
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

-- Lab results
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

-- Outbreaks
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

-- Notifications
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

-- Audit logs
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

-- ============================================================================
-- STEP 4: ENABLE RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.outbreaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disease_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
  CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

  DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
  CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);
END$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
  CREATE POLICY user_roles_select_own ON public.user_roles
    FOR SELECT USING ((SELECT auth.uid()) = user_id);
END$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS disease_codes_public_select ON public.disease_codes;
  CREATE POLICY disease_codes_public_select ON public.disease_codes
    FOR SELECT TO authenticated USING (true);
END$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS case_reports_select_auth ON public.case_reports;
  CREATE POLICY case_reports_select_auth ON public.case_reports
    FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS case_reports_insert_auth ON public.case_reports;
  CREATE POLICY case_reports_insert_auth ON public.case_reports
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = reporter_id);
END$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS lab_results_select_auth ON public.lab_results;
  CREATE POLICY lab_results_select_auth ON public.lab_results
    FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS lab_results_insert_auth ON public.lab_results;
  CREATE POLICY lab_results_insert_auth ON public.lab_results
    FOR INSERT TO authenticated WITH CHECK (true);
END$$;

-- ============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
  CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  DROP TRIGGER IF EXISTS user_roles_set_updated_at ON public.user_roles;
  CREATE TRIGGER user_roles_set_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  DROP TRIGGER IF EXISTS case_reports_set_updated_at ON public.case_reports;
  CREATE TRIGGER case_reports_set_updated_at
    BEFORE UPDATE ON public.case_reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  DROP TRIGGER IF EXISTS facilities_set_updated_at ON public.facilities;
  CREATE TRIGGER facilities_set_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  DROP TRIGGER IF EXISTS lab_results_set_updated_at ON public.lab_results;
  CREATE TRIGGER lab_results_set_updated_at
    BEFORE UPDATE ON public.lab_results
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  DROP TRIGGER IF EXISTS outbreaks_set_updated_at ON public.outbreaks;
  CREATE TRIGGER outbreaks_set_updated_at
    BEFORE UPDATE ON public.outbreaks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END$$;

-- ============================================================================
-- STEP 7: INSERT REFERENCE DATA
-- ============================================================================

-- Insert Districts (Rwanda - Kigali City)
INSERT INTO public.districts (name, code, province, population)
VALUES
  ('Gasabo', 'GA', 'Kigali City', 530907),
  ('Kicukiro', 'KI', 'Kigali City', 318787),
  ('Nyarugenge', 'NY', 'Kigali City', 284561)
ON CONFLICT (name) DO NOTHING;

-- Insert Facilities (sample health facilities)
DO $$
DECLARE
  gasabo_id UUID;
  kicukiro_id UUID;
  nyarugenge_id UUID;
BEGIN
  SELECT id INTO gasabo_id FROM public.districts WHERE name = 'Gasabo';
  SELECT id INTO kicukiro_id FROM public.districts WHERE name = 'Kicukiro';
  SELECT id INTO nyarugenge_id FROM public.districts WHERE name = 'Nyarugenge';

  INSERT INTO public.facilities (name, district_id, type, latitude, longitude, contact_phone, is_active)
  VALUES
    ('Kigali University Teaching Hospital', gasabo_id, 'Referral Hospital', -1.9536, 30.0605, '+250788123456', true),
    ('King Faisal Hospital', gasabo_id, 'Referral Hospital', -1.9575, 30.1048, '+250788234567', true),
    ('Kicukiro District Hospital', kicukiro_id, 'District Hospital', -1.9897, 30.1241, '+250788345678', true),
    ('Nyarugenge Health Center', nyarugenge_id, 'Health Center', -1.9511, 30.0588, '+250788456789', true),
    ('Remera Health Center', gasabo_id, 'Health Center', -1.9482, 30.1044, '+250788567890', true)
  ON CONFLICT DO NOTHING;
END$$;

-- Insert WHO IDSR Priority Diseases
INSERT INTO public.disease_codes (code, name, description, symptoms, is_notifiable, alert_threshold, threshold_days)
VALUES
  ('CHOL', 'Cholera', 'Acute watery diarrhea caused by Vibrio cholerae', 
   ARRAY['acute_watery_diarrhea', 'vomiting', 'dehydration', 'muscle_cramps'], 
   true, 1, 1),
  
  ('MEAS', 'Measles', 'Highly contagious viral disease', 
   ARRAY['fever', 'rash', 'cough', 'conjunctivitis', 'runny_nose'], 
   true, 1, 7),
  
  ('COVID', 'COVID-19', 'Coronavirus disease 2019', 
   ARRAY['fever', 'cough', 'breathing_difficulty', 'loss_of_taste_smell', 'fatigue'], 
   true, 5, 7),
  
  ('MALA', 'Malaria', 'Mosquito-borne parasitic disease', 
   ARRAY['fever', 'chills', 'headache', 'nausea', 'vomiting', 'muscle_pain'], 
   true, 10, 7),
  
  ('EBOLA', 'Ebola Virus Disease', 'Severe hemorrhagic fever', 
   ARRAY['fever', 'severe_headache', 'muscle_pain', 'vomiting', 'bleeding', 'diarrhea'], 
   true, 1, 1),
  
  ('YELFEV', 'Yellow Fever', 'Mosquito-borne viral hemorrhagic disease', 
   ARRAY['fever', 'headache', 'jaundice', 'muscle_pain', 'nausea', 'vomiting'], 
   true, 1, 7),
  
  ('MENIN', 'Meningococcal Meningitis', 'Bacterial infection of brain/spinal cord membranes', 
   ARRAY['fever', 'severe_headache', 'stiff_neck', 'confusion', 'photophobia', 'vomiting'], 
   true, 2, 7),
  
  ('AFP', 'Acute Flaccid Paralysis', 'Sudden onset of paralysis (Polio indicator)', 
   ARRAY['weakness', 'paralysis', 'difficulty_breathing', 'muscle_pain'], 
   true, 1, 1),
  
  ('RABIES', 'Rabies', 'Fatal viral disease transmitted by animal bites', 
   ARRAY['fever', 'headache', 'anxiety', 'confusion', 'hydrophobia', 'paralysis'], 
   true, 1, 1),
  
  ('TYPHOID', 'Typhoid Fever', 'Bacterial infection caused by Salmonella typhi', 
   ARRAY['prolonged_fever', 'headache', 'abdominal_pain', 'constipation', 'weakness'], 
   true, 5, 7),
  
  ('TB', 'Tuberculosis', 'Bacterial infection primarily affecting lungs', 
   ARRAY['persistent_cough', 'fever', 'night_sweats', 'weight_loss', 'chest_pain'], 
   true, 10, 30),
  
  ('HIV', 'HIV/AIDS', 'Human Immunodeficiency Virus', 
   ARRAY['fever', 'fatigue', 'weight_loss', 'swollen_lymph_nodes', 'opportunistic_infections'], 
   true, NULL, NULL),
  
  ('DENG', 'Dengue Fever', 'Mosquito-borne viral infection', 
   ARRAY['high_fever', 'severe_headache', 'pain_behind_eyes', 'joint_pain', 'rash'], 
   true, 5, 7),
  
  ('ANTX', 'Anthrax', 'Bacterial infection caused by Bacillus anthracis', 
   ARRAY['fever', 'skin_lesions', 'breathing_difficulty', 'chest_pain', 'cough'], 
   true, 1, 1),
  
  ('PLAGU', 'Plague', 'Bacterial disease caused by Yersinia pestis', 
   ARRAY['fever', 'chills', 'weakness', 'swollen_lymph_nodes', 'cough'], 
   true, 1, 1)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 8: INITIALIZE YOUR ADMIN USER
-- ============================================================================
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual auth.users ID
-- To get your ID, run: SELECT id, email FROM auth.users;
-- ============================================================================

-- First, check if you have a user in auth.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the first user from auth.users (assumes you already created one)
  SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found user ID: %', admin_user_id;
    
    -- Insert profile for this user (if doesn't exist)
    INSERT INTO public.profiles (id, full_name, phone, is_active)
    VALUES (admin_user_id, 'System Administrator', '+250788000000', true)
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    -- Insert admin role for this user (if doesn't exist)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id) DO UPDATE 
    SET role = EXCLUDED.role,
        updated_at = NOW();
    
    RAISE NOTICE 'Profile and admin role created for user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No user found in auth.users. Create a user in Supabase Dashboard first!';
  END IF;
END$$;

-- ============================================================================
-- STEP 9: VERIFY DATA
-- ============================================================================

-- Show what was created
SELECT 'Districts:' AS table_name, COUNT(*) AS count FROM public.districts
UNION ALL
SELECT 'Facilities:', COUNT(*) FROM public.facilities
UNION ALL
SELECT 'Disease Codes:', COUNT(*) FROM public.disease_codes
UNION ALL
SELECT 'Profiles:', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'User Roles:', COUNT(*) FROM public.user_roles;

-- Show your admin user info
SELECT 
  u.id,
  u.email,
  p.full_name,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
ORDER BY u.created_at DESC;

-- ============================================================================
-- DONE! Your database is fully initialized.
-- ============================================================================
-- Next steps:
-- 1. If you see "No user found", go to Supabase Dashboard → Authentication → Add User
-- 2. After creating user, run STEP 8 again to create profile and role
-- 3. Login at your app: http://localhost:3000/auth
-- ============================================================================
