-- ============================================================================
-- SIMPLE VERIFICATION - Check if all fixes were applied
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================================================

-- This is MUCH simpler than the complex fixes
-- Just run this to see what's working and what needs to be fixed

-- ============================================================================
-- TEST 1: Disease Codes
-- ============================================================================
SELECT 
  '1. Disease Codes' as test,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS - ' || COUNT(*) || ' diseases found'
    ELSE '❌ FAIL - Only ' || COUNT(*) || ' diseases. Run fix_missing_data.sql'
  END as result
FROM disease_codes;

-- ============================================================================
-- TEST 2: Districts
-- ============================================================================
SELECT 
  '2. Districts' as test,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS - ' || COUNT(*) || ' districts found'
    ELSE '❌ FAIL - Only ' || COUNT(*) || ' districts. Run fix_missing_data.sql'
  END as result
FROM districts;

-- ============================================================================
-- TEST 3: Facilities
-- ============================================================================
SELECT 
  '3. Facilities' as test,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASS - ' || COUNT(*) || ' facilities found'
    ELSE '❌ FAIL - No facilities. Run fix_missing_data.sql'
  END as result
FROM facilities;

-- ============================================================================
-- TEST 4: Lab Results Schema (tested_at column)
-- ============================================================================
SELECT 
  '4. Lab Results Schema' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'lab_results' AND column_name = 'tested_at'
    ) THEN '✅ PASS - tested_at column exists'
    ELSE '❌ FAIL - tested_at missing. Run fix_all_critical_issues.sql'
  END as result;

-- ============================================================================
-- TEST 5: Storage Bucket
-- ============================================================================
SELECT 
  '5. Storage Bucket' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = 'case-attachments'
    ) THEN '✅ PASS - case-attachments bucket exists'
    ELSE '❌ FAIL - Bucket missing. Create it in Supabase Storage UI'
  END as result;

-- ============================================================================
-- TEST 6: Dashboard Stats RPC Function
-- ============================================================================
SELECT 
  '6. Dashboard Stats RPC' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'dashboard_stats'
    ) THEN '✅ PASS - dashboard_stats() function exists'
    ELSE '❌ FAIL - RPC missing. Run database_optimization.sql'
  END as result;

-- ============================================================================
-- TEST 7: RBAC Functions
-- ============================================================================
SELECT 
  '7. RBAC Functions' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'has_role'
    ) THEN '✅ PASS - RBAC functions exist'
    ELSE '❌ FAIL - RBAC missing. Run fix_all_critical_issues.sql'
  END as result;

-- ============================================================================
-- TEST 8: Admin RLS Policies
-- ============================================================================
SELECT 
  '8. Admin RLS Policies' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_roles' 
      AND policyname LIKE '%admin%'
    ) THEN '✅ PASS - Admin policies configured'
    ELSE '❌ FAIL - Admin RLS missing. Run fix_all_critical_issues.sql'
  END as result;

-- ============================================================================
-- TEST 9: Performance Indexes
-- ============================================================================
SELECT 
  '9. Performance Indexes' as test,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS - ' || COUNT(*) || ' indexes found'
    ELSE '⚠️ WARNING - Only ' || COUNT(*) || ' indexes. Run database_optimization.sql for better performance'
  END as result
FROM pg_indexes 
WHERE tablename IN ('case_reports', 'lab_results', 'user_roles')
AND indexname LIKE 'idx_%';

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  '═══════════════════════════════════════════' as separator,
  'SUMMARY' as title,
  '═══════════════════════════════════════════' as separator2
UNION ALL
SELECT 
  '',
  'Run all tests above and check for ❌ FAIL marks',
  ''
UNION ALL
SELECT 
  '',
  'If you see failures, run the SQL file mentioned in the result',
  '';

-- ============================================================================
-- QUICK FIX GUIDE
-- ============================================================================
/*

IF YOU SEE FAILURES:

1. ❌ Disease Codes missing
   → Run: fix_missing_data.sql

2. ❌ Districts/Facilities missing
   → Run: fix_missing_data.sql

3. ❌ tested_at column missing
   → Run: fix_all_critical_issues.sql

4. ❌ Storage bucket missing
   → Go to Supabase Dashboard → Storage → Create bucket "case-attachments"

5. ❌ RPC function missing
   → Run: database_optimization.sql

6. ❌ RBAC functions missing
   → Run: fix_all_critical_issues.sql

7. ❌ Admin RLS missing
   → Run: fix_all_critical_issues.sql

8. ⚠️ Few indexes
   → Run: database_optimization.sql (optional but recommended)

*/
