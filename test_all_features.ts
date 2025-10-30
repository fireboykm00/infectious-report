/**
 * Comprehensive Test Suite for IDSR Platform
 * Run this after applying fixes to verify all features work
 */

import { supabase } from './src/integrations/supabase/client'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

/**
 * Test runner
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
  const start = Date.now()
  try {
    await testFn()
    return {
      name,
      passed: true,
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    }
  }
}

/**
 * Test Suite
 */
async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Database Connection
  results.push(
    await runTest('Database Connection', async () => {
      const { error } = await supabase.from('disease_codes').select('count').single()
      if (error) throw error
    })
  )

  // Test 2: Disease Codes Populated
  results.push(
    await runTest('Disease Codes Populated', async () => {
      const { data, error } = await supabase
        .from('disease_codes')
        .select('code, name')
        .limit(1)
      
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('No disease codes found - run fix_missing_data.sql')
      }
    })
  )

  // Test 3: Districts Exist
  results.push(
    await runTest('Districts Exist', async () => {
      const { data, error } = await supabase
        .from('districts')
        .select('id')
        .limit(1)
      
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('No districts found - run fix_missing_data.sql')
      }
    })
  )

  // Test 4: Facilities Exist
  results.push(
    await runTest('Facilities Exist', async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('id')
        .limit(1)
      
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('No facilities found - run fix_missing_data.sql')
      }
    })
  )

  // Test 5: Storage Bucket Exists
  results.push(
    await runTest('Storage Bucket Exists', async () => {
      const { data, error } = await supabase.storage.getBucket('case-attachments')
      
      if (error) throw new Error(`Bucket not found: ${error.message}`)
      if (!data) throw new Error('Bucket case-attachments does not exist')
    })
  )

  // Test 6: RPC Functions Exist
  results.push(
    await runTest('Dashboard Stats RPC', async () => {
      const { data, error } = await supabase.rpc('dashboard_stats' as any)
      
      if (error) throw new Error(`RPC function not found: ${error.message}`)
    })
  )

  // Test 7: RBAC Functions Exist
  results.push(
    await runTest('RBAC Functions Exist', async () => {
      const { error } = await supabase.rpc('has_role' as any, { required_role: 'admin' })
      
      // Function exists even if it returns false
      if (error && !error.message.includes('permission denied')) {
        throw new Error(`RBAC function not found: ${error.message}`)
      }
    })
  )

  // Test 8: Lab Results Schema
  results.push(
    await runTest('Lab Results Schema Correct', async () => {
      const { data, error } = await supabase
        .from('lab_results')
        .select('tested_at')
        .limit(1)
      
      if (error && error.message.includes('test_date')) {
        throw new Error('Column test_date still exists - run fix_all_critical_issues.sql')
      }
      if (error && error.message.includes('tested_at')) {
        throw new Error('Column tested_at missing - run fix_all_critical_issues.sql')
      }
    })
  )

  // Test 9: User Roles RLS
  results.push(
    await runTest('User Roles RLS Policies', async () => {
      // This will fail if user isn't authenticated, which is expected
      const { error } = await supabase.from('user_roles').select('role').limit(1)
      
      // Error is okay if user is not authenticated
      // What we're checking is that the query doesn't fail with policy errors
      if (error && error.code === '42501') {
        throw new Error('RLS policy too restrictive - run fix_all_critical_issues.sql')
      }
    })
  )

  // Test 10: Case Reports Access
  results.push(
    await runTest('Case Reports Access', async () => {
      const { error } = await supabase
        .from('case_reports')
        .select('id, disease_code, status')
        .limit(5)
      
      if (error) throw error
    })
  )

  return results
}

/**
 * Print test results
 */
function printResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(60))
  console.log('IDSR PLATFORM - TEST RESULTS')
  console.log('='.repeat(60) + '\n')

  let passed = 0
  let failed = 0

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    const duration = `${result.duration}ms`
    
    console.log(`${index + 1}. ${result.name}`)
    console.log(`   Status: ${status} (${duration})`)
    
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`)
    }
    
    console.log('')

    if (result.passed) passed++
    else failed++
  })

  console.log('='.repeat(60))
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(60) + '\n')

  if (failed > 0) {
    console.log('⚠️  FIXES NEEDED:')
    console.log('')
    
    results.forEach((result) => {
      if (!result.passed) {
        console.log(`- ${result.name}:`)
        console.log(`  ${result.error}`)
        console.log('')
      }
    })
  } else {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('Your IDSR platform is ready to use.')
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting comprehensive tests...\n')
  
  const results = await runAllTests()
  printResults(results)
}

// Run if executed directly
if (typeof window === 'undefined' && require.main === module) {
  main().catch(console.error)
}

export { runAllTests, printResults }
