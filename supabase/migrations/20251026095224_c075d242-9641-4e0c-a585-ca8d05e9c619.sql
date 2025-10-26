-- ============================================================================
-- IDSR System Database Schema
-- Security, Privacy & Compliance Foundation
-- ============================================================================

-- 1. CREATE ENUMS
-- ============================================================================

-- Application roles enum
CREATE TYPE public.app_role AS ENUM (
  'reporter',           -- Facility/community health workers
  'lab_tech',          -- Laboratory technicians
  'district_officer',  -- District health officers
  'national_officer',  -- National level officers
  'admin'              -- System administrators
);

-- Case status enum
CREATE TYPE public.case_status AS ENUM (
  'suspected',
  'confirmed',
  'ruled_out',
  'pending_lab'
);

-- Lab result enum
CREATE TYPE public.lab_result AS ENUM (
  'positive',
  'negative',
  'inconclusive'
);

-- Notification channel enum
CREATE TYPE public.notification_channel AS ENUM (
  'email',
  'sms',
  'push'
);

-- Notification status enum
CREATE TYPE public.notification_status AS ENUM (
  'pending',
  'sent',
  'failed'
);

-- Outbreak status enum
CREATE TYPE public.outbreak_status AS ENUM (
  'active',
  'contained',
  'resolved'
);

-- Sync status enum for offline support
CREATE TYPE public.sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'failed'
);

-- 2. CREATE CORE TABLES
-- ============================================================================

-- User Profiles (minimal PII)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  facility_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Facilities
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- hospital, clinic, health_center, laboratory
  district_id UUID,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Districts (for geographical organization)
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  province TEXT,
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disease Codes (controlled vocabulary)
CREATE TABLE public.disease_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_notifiable BOOLEAN DEFAULT true,
  alert_threshold INTEGER, -- cases within threshold_days to trigger alert
  threshold_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Case Reports (core entity)
CREATE TABLE public.case_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  district_id UUID REFERENCES public.districts(id),
  disease_code TEXT REFERENCES public.disease_codes(code) NOT NULL,
  
  -- Demographics (aggregated, no PII)
  age_group TEXT NOT NULL, -- 0-5, 6-17, 18-49, 50-64, 65+
  gender TEXT NOT NULL, -- male, female, other
  
  -- Clinical data
  symptoms TEXT NOT NULL,
  status public.case_status DEFAULT 'suspected',
  
  -- Location
  location_detail TEXT, -- district/sector level only
  
  -- Metadata
  notes TEXT,
  attachments JSONB, -- array of file paths
  
  -- Offline sync support
  client_local_id TEXT, -- for deduplication
  sync_status public.sync_status DEFAULT 'synced',
  sync_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lab Results
CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_report_id UUID REFERENCES public.case_reports(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL,
  result public.lab_result NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL,
  lab_technician_id UUID REFERENCES auth.users(id) NOT NULL,
  lab_facility_id UUID REFERENCES public.facilities(id),
  notes TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outbreaks
CREATE TABLE public.outbreaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_code TEXT REFERENCES public.disease_codes(code) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status public.outbreak_status DEFAULT 'active',
  affected_districts UUID[] DEFAULT ARRAY[]::UUID[],
  case_count INTEGER DEFAULT 0,
  response_actions JSONB, -- JSON array of response playbook steps
  declared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES auth.users(id),
  recipient_email TEXT,
  recipient_phone TEXT,
  channel public.notification_channel NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  payload JSONB, -- additional structured data
  status public.notification_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs (immutable)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE, LOGIN, etc.
  target_type TEXT NOT NULL, -- table name
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_facility ON public.profiles(facility_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_facilities_district ON public.facilities(district_id);
CREATE INDEX idx_case_reports_reporter ON public.case_reports(reporter_id);
CREATE INDEX idx_case_reports_facility ON public.case_reports(facility_id);
CREATE INDEX idx_case_reports_district ON public.case_reports(district_id);
CREATE INDEX idx_case_reports_disease ON public.case_reports(disease_code);
CREATE INDEX idx_case_reports_status ON public.case_reports(status);
CREATE INDEX idx_case_reports_date ON public.case_reports(report_date);
CREATE INDEX idx_case_reports_client_local_id ON public.case_reports(client_local_id);
CREATE INDEX idx_lab_results_case ON public.lab_results(case_report_id);
CREATE INDEX idx_lab_results_tech ON public.lab_results(lab_technician_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- 4. SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- Function to get user's primary role (highest privilege)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'national_officer' THEN 2
      WHEN 'district_officer' THEN 3
      WHEN 'lab_tech' THEN 4
      WHEN 'reporter' THEN 5
    END
  LIMIT 1
$$;

-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_reports_updated_at
  BEFORE UPDATE ON public.case_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outbreaks_updated_at
  BEFORE UPDATE ON public.outbreaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update case status when lab result is positive
CREATE OR REPLACE FUNCTION public.update_case_status_on_lab_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.result = 'positive' THEN
    UPDATE public.case_reports
    SET status = 'confirmed'
    WHERE id = NEW.case_report_id;
  ELSIF NEW.result = 'negative' THEN
    UPDATE public.case_reports
    SET status = 'ruled_out'
    WHERE id = NEW.case_report_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lab_result_insert
  AFTER INSERT ON public.lab_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_case_status_on_lab_result();

-- 6. AUDIT LOGGING TRIGGERS
-- ============================================================================

-- Generic audit logging function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, action, target_type, target_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (user_id, action, target_type, target_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, action, target_type, target_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit triggers to all critical tables
CREATE TRIGGER audit_case_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.case_reports
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_lab_results
  AFTER INSERT OR UPDATE OR DELETE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_outbreaks
  AFTER INSERT OR UPDATE OR DELETE ON public.outbreaks
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbreaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Facilities policies
CREATE POLICY "Anyone can view active facilities"
  ON public.facilities FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins and national officers can manage facilities"
  ON public.facilities FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'national_officer']::public.app_role[]));

-- Districts policies (read-only for most users)
CREATE POLICY "Anyone can view districts"
  ON public.districts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage districts"
  ON public.districts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Disease codes policies
CREATE POLICY "Anyone can view active disease codes"
  ON public.disease_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins and national officers can manage disease codes"
  ON public.disease_codes FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'national_officer']::public.app_role[]));

-- Case reports policies
CREATE POLICY "Users can view case reports in their district"
  ON public.case_reports FOR SELECT
  TO authenticated
  USING (
    -- Admins and national officers see all
    public.has_any_role(auth.uid(), ARRAY['admin', 'national_officer']::public.app_role[])
    OR
    -- District officers see their district
    (public.has_role(auth.uid(), 'district_officer') AND 
     district_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()))
    OR
    -- Reporters see their own reports
    reporter_id = auth.uid()
  );

CREATE POLICY "Reporters can create case reports"
  ON public.case_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['reporter', 'district_officer', 'national_officer', 'admin']::public.app_role[])
    AND reporter_id = auth.uid()
  );

CREATE POLICY "Reporters can update their own reports"
  ON public.case_reports FOR UPDATE
  TO authenticated
  USING (reporter_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin', 'national_officer']::public.app_role[]));

-- Lab results policies
CREATE POLICY "Users can view lab results for accessible cases"
  ON public.lab_results FOR SELECT
  TO authenticated
  USING (
    case_report_id IN (
      SELECT id FROM public.case_reports
      WHERE public.has_any_role(auth.uid(), ARRAY['admin', 'national_officer']::public.app_role[])
      OR reporter_id = auth.uid()
    )
  );

CREATE POLICY "Lab techs can create lab results"
  ON public.lab_results FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['lab_tech', 'admin']::public.app_role[])
    AND lab_technician_id = auth.uid()
  );

-- Outbreaks policies
CREATE POLICY "Everyone can view outbreaks"
  ON public.outbreaks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only national officers and admins can manage outbreaks"
  ON public.outbreaks FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'national_officer']::public.app_role[]));

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Audit logs policies (read-only for admins)
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. SEED DATA
-- ============================================================================

-- Insert common disease codes
INSERT INTO public.disease_codes (code, name, alert_threshold, threshold_days) VALUES
  ('MALARIA', 'Malaria', 10, 7),
  ('CHOLERA', 'Cholera', 5, 7),
  ('COVID19', 'COVID-19', 10, 7),
  ('MEASLES', 'Measles', 3, 7),
  ('TYPHOID', 'Typhoid Fever', 5, 7),
  ('TB', 'Tuberculosis', 5, 30),
  ('DENGUE', 'Dengue Fever', 5, 7),
  ('HEPATITIS', 'Hepatitis', 5, 14),
  ('MENINGITIS', 'Meningitis', 3, 7),
  ('YELLOW_FEVER', 'Yellow Fever', 1, 7);

-- Insert sample districts (Rwanda districts)
INSERT INTO public.districts (name, code, province) VALUES
  ('Kigali', 'KGL', 'Kigali City'),
  ('Gasabo', 'GSB', 'Kigali City'),
  ('Kicukiro', 'KCK', 'Kigali City'),
  ('Nyarugenge', 'NYR', 'Kigali City'),
  ('Bugesera', 'BGS', 'Eastern Province'),
  ('Gatsibo', 'GTS', 'Eastern Province'),
  ('Kayonza', 'KYZ', 'Eastern Province'),
  ('Kirehe', 'KRH', 'Eastern Province'),
  ('Ngoma', 'NGM', 'Eastern Province'),
  ('Nyagatare', 'NYG', 'Eastern Province'),
  ('Rwamagana', 'RWM', 'Eastern Province');

-- 9. ENABLE REALTIME FOR CRITICAL TABLES
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.case_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.outbreaks;