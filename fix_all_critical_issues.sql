-- ============================================================================
-- COMPREHENSIVE FIX - All Critical Issues
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ISSUE #1: Fix lab_results schema - test_date vs tested_at
-- ============================================================================

-- Check if test_date column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lab_results' AND column_name = 'test_date'
    ) THEN
        -- Rename test_date to tested_at for consistency
        ALTER TABLE lab_results RENAME COLUMN test_date TO tested_at;
        RAISE NOTICE 'Renamed test_date to tested_at';
    END IF;
    
    -- Ensure tested_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lab_results' AND column_name = 'tested_at'
    ) THEN
        ALTER TABLE lab_results ADD COLUMN tested_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added tested_at column';
    END IF;
END $$;

-- ============================================================================
-- ISSUE #2: Fix RLS Policies for Admin Operations
-- ============================================================================

-- Drop existing restrictive policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Only system can insert roles" ON user_roles;

-- Create new policies that allow admin operations
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can insert roles"
ON user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- ============================================================================
-- ISSUE #3: Fix profiles table RLS for admin
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- ISSUE #4: Create helper functions for RBAC
-- ============================================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(required_role text)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = required_role::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION has_any_role(required_roles text[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(required_roles::app_role[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS app_role AS $$
  SELECT role FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_role TO authenticated;
GRANT EXECUTE ON FUNCTION has_any_role TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;

-- ============================================================================
-- ISSUE #5: Fix case_reports RLS for proper role-based access
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view case reports" ON case_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON case_reports;

-- Everyone with proper role can view
CREATE POLICY "Authenticated users can view case reports"
ON case_reports FOR SELECT
TO authenticated
USING (true);

-- Reporters and above can create
CREATE POLICY "Authorized users can create case reports"
ON case_reports FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(ARRAY['reporter', 'lab_tech', 'district_officer', 'national_officer', 'admin'])
);

-- District officers and above can update
CREATE POLICY "Officers can update case reports"
ON case_reports FOR UPDATE
TO authenticated
USING (
  has_any_role(ARRAY['district_officer', 'national_officer', 'admin'])
);

-- Only admins can delete
CREATE POLICY "Admins can delete case reports"
ON case_reports FOR DELETE
TO authenticated
USING (has_role('admin'));

-- ============================================================================
-- ISSUE #6: Fix lab_results RLS for lab techs
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view lab results" ON lab_results;

CREATE POLICY "Authenticated users can view lab results"
ON lab_results FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Lab techs can create lab results"
ON lab_results FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(ARRAY['lab_tech', 'admin'])
);

CREATE POLICY "Lab techs can update their lab results"
ON lab_results FOR UPDATE
TO authenticated
USING (
  lab_technician_id = auth.uid() OR has_role('admin')
);

CREATE POLICY "Admins can delete lab results"
ON lab_results FOR DELETE
TO authenticated
USING (has_role('admin'));

-- ============================================================================
-- ISSUE #7: Fix outbreaks RLS for proper access
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view outbreaks" ON outbreaks;

CREATE POLICY "Authenticated users can view outbreaks"
ON outbreaks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Officers can create outbreaks"
ON outbreaks FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(ARRAY['district_officer', 'national_officer', 'admin'])
);

CREATE POLICY "Officers can update outbreaks"
ON outbreaks FOR UPDATE
TO authenticated
USING (
  has_any_role(ARRAY['district_officer', 'national_officer', 'admin'])
);

CREATE POLICY "Admins can delete outbreaks"
ON outbreaks FOR DELETE
TO authenticated
USING (has_role('admin'));

-- ============================================================================
-- ISSUE #8: Add missing indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_facility_id ON profiles(facility_id);
CREATE INDEX IF NOT EXISTS idx_profiles_district_id ON profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_technician ON lab_results(lab_technician_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check lab_results columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lab_results'
ORDER BY ordinal_position;

-- Check user_roles policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Check RBAC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('has_role', 'has_any_role', 'get_user_role');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All critical issues fixed!';
  RAISE NOTICE '1. lab_results schema corrected (tested_at column)';
  RAISE NOTICE '2. Admin can now manage users (RLS policies updated)';
  RAISE NOTICE '3. RBAC functions created (has_role, has_any_role)';
  RAISE NOTICE '4. Role-based access configured for all tables';
  RAISE NOTICE '5. Performance indexes added';
END $$;
