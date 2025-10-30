# Refactoring Execution Guide

**Start Date:** October 30, 2025  
**Estimated Duration:** 3-5 days  
**Approach:** Incremental refactor (app stays functional during refactor)

---

## 🎯 Strategy: Keep Supabase, Simplify Architecture

### Why Keep Supabase?
1. ✅ Auth already working
2. ✅ Real-time subscriptions built-in
3. ✅ Storage for attachments
4. ✅ Free tier generous  
5. ✅ Migration would take 2-3 days

### What We'll Fix:
- Simplify complex queries
- Add proper database indexes
- Remove duplicate code
- Clean folder structure
- Fix TanStack Query issues
- Separate server/client code properly

---

## 📝 Step-by-Step Execution

### Step 1: Database Optimizations (30 minutes)

Run these in Supabase SQL Editor:

```sql
-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_case_reports_created_at 
  ON case_reports(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_case_reports_disease 
  ON case_reports(disease_code);
  
CREATE INDEX IF NOT EXISTS idx_case_reports_status 
  ON case_reports(status);
  
CREATE INDEX IF NOT EXISTS idx_case_reports_district 
  ON case_reports(district_id);

CREATE INDEX IF NOT EXISTS idx_case_reports_reporter 
  ON case_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_case_reports_status_date 
  ON case_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_results_case 
  ON lab_results(case_report_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
  ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
  ON audit_logs(timestamp DESC);

-- Create RPC function for dashboard stats (faster than client aggregation)
CREATE OR REPLACE FUNCTION dashboard_stats(p_district_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_cases', COUNT(*),
    'confirmed_cases', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'suspected_cases', COUNT(*) FILTER (WHERE status = 'suspected'),
    'pending_lab', COUNT(*) FILTER (WHERE status = 'pending_lab'),
    'ruled_out', COUNT(*) FILTER (WHERE status = 'ruled_out')
  )
  INTO result
  FROM case_reports
  WHERE (p_district_id IS NULL OR district_id = p_district_id)
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION dashboard_stats TO authenticated;
```

---

### Step 2: Create New Folder Structure (1 hour)

#### 2.1 Create Feature Directories

```bash
cd /home/backer/Workspace/NEW/infectious-report

# Create feature-based structure
mkdir -p src/features/auth/{components,hooks}
mkdir -p src/features/cases/{components,hooks}
mkdir -p src/features/lab/{components,hooks}
mkdir -p src/features/outbreaks/{components,hooks}
mkdir -p src/features/analytics/{components,hooks}

# Create lib subdirectories
mkdir -p src/lib/{validations,supabase}

# Create shared components
mkdir -p src/components/{layout,shared}
```

---

### Step 3: Create Validation Schemas (30 minutes)

#### 3.1 Create Case Validation Schema

Create `src/lib/validations/case.ts`:
```typescript
import { z } from 'zod'

export const caseReportSchema = z.object({
  disease_code: z.string().min(1, 'Disease is required'),
  age_group: z.enum(['0-5', '6-17', '18-49', '50-64', '65+']),
  gender: z.enum(['male', 'female', 'other']),
  symptoms: z.string().min(10, 'Please describe symptoms (at least 10 characters)'),
  location_detail: z.string().min(1, 'Location is required'),
  district_id: z.string().uuid('Invalid district'),
  facility_id: z.string().uuid('Invalid facility').optional(),
  status: z.enum(['suspected', 'confirmed', 'ruled_out', 'pending_lab']).default('suspected'),
  notes: z.string().optional(),
})

export type CaseReportInput = z.infer<typeof caseReportSchema>

export const caseUpdateSchema = caseReportSchema.partial().extend({
  id: z.string().uuid(),
})
```

#### 3.2 Create Lab Validation Schema

Create `src/lib/validations/lab.ts`:
```typescript
import { z } from 'zod'

export const labResultSchema = z.object({
  case_report_id: z.string().uuid('Invalid case report'),
  test_type: z.string().min(1, 'Test type is required'),
  result: z.enum(['positive', 'negative', 'inconclusive']),
  tested_at: z.string().datetime('Invalid date'),
  notes: z.string().optional(),
})

export type LabResultInput = z.infer<typeof labResultSchema>
```

#### 3.3 Create Auth Validation Schema

Create `src/lib/validations/auth.ts`:
```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['reporter', 'lab_tech', 'district_officer', 'national_officer', 'admin']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
```

---

### Step 4: Create Supabase Server Client (30 minutes)

#### 4.1 Server Client for Server Components

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient as createClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export function createServerClient() {
  const cookieStore = cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

#### 4.2 Middleware Client

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient as createClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

export function createServerClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}
```

#### 4.3 Update Browser Client

Update `src/lib/supabase/client.ts` (simplify it):
```typescript
import { createBrowserClient as createClient } from '@supabase/ssr'
import type { Database } from './types'

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export singleton instance for backward compatibility
export const supabase = createBrowserClient()
```

---

### Step 5: Create Server Actions (1 hour)

#### 5.1 Case Report Actions

Create `src/features/cases/actions.ts`:
```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { caseReportSchema, caseUpdateSchema } from '@/lib/validations/case'

export async function createCaseReport(formData: unknown) {
  const supabase = createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to create a case report' }
  }

  // Validate input
  const validated = caseReportSchema.safeParse(formData)

  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten().fieldErrors,
    }
  }

  // Insert into database
  const { data: caseReport, error } = await supabase
    .from('case_reports')
    .insert({
      ...validated.data,
      reporter_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating case report:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/report')

  return { data: caseReport }
}

export async function updateCaseReport(formData: unknown) {
  const supabase = createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Validate input
  const validated = caseUpdateSchema.safeParse(formData)

  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten().fieldErrors,
    }
  }

  const { id, ...updates } = validated.data

  // Update database
  const { data: caseReport, error } = await supabase
    .from('case_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating case report:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath('/dashboard')

  return { data: caseReport }
}

export async function deleteCaseReport(id: string) {
  const supabase = createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Delete from database
  const { error } = await supabase.from('case_reports').delete().eq('id', id)

  if (error) {
    console.error('Error deleting case report:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath('/dashboard')

  return { success: true }
}
```

#### 5.2 Lab Result Actions

Create `src/features/lab/actions.ts`:
```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { labResultSchema } from '@/lib/validations/lab'

export async function createLabResult(formData: unknown) {
  const supabase = createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Validate input
  const validated = labResultSchema.safeParse(formData)

  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten().fieldErrors,
    }
  }

  // Insert lab result
  const { data: labResult, error: resultError } = await supabase
    .from('lab_results')
    .insert({
      ...validated.data,
      lab_technician_id: user.id,
    })
    .select()
    .single()

  if (resultError) {
    console.error('Error creating lab result:', resultError)
    return { error: resultError.message }
  }

  // Update case status based on result
  const newStatus =
    validated.data.result === 'positive'
      ? 'confirmed'
      : validated.data.result === 'negative'
      ? 'ruled_out'
      : 'pending_lab'

  const { error: updateError } = await supabase
    .from('case_reports')
    .update({ status: newStatus })
    .eq('id', validated.data.case_report_id)

  if (updateError) {
    console.error('Error updating case status:', updateError)
    // Don't fail the whole operation if case update fails
  }

  // Revalidate cache
  revalidatePath('/dashboard/lab')
  revalidatePath('/dashboard')

  return { data: labResult }
}
```

---

### Step 6: Simplify Query Hooks (1 hour)

#### 6.1 Create Simplified Case Hooks

Create `src/features/cases/hooks.ts`:
```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import { createCaseReport, updateCaseReport, deleteCaseReport } from './actions'
import type { Database } from '@/lib/supabase/types'

type CaseReport = Database['public']['Tables']['case_reports']['Row']

interface CaseFilters {
  disease?: string
  status?: string
  district?: string
}

export function useCases(filters?: CaseFilters) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('case_reports')
        .select('id, disease_code, status, age_group, gender, created_at, location_detail, symptoms')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filters?.disease) {
        query = query.eq('disease_code', filters.disease)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.district) {
        query = query.eq('district_id', filters.district)
      }

      const { data, error } = await query

      if (error) throw error
      return data as CaseReport[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCaseById(id: string) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['cases', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as CaseReport
    },
    enabled: !!id,
  })
}

export function useCaseStats() {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['case-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('dashboard_stats')

      if (error) throw error
      return data as {
        total_cases: number
        confirmed_cases: number
        suspected_cases: number
        pending_lab: number
        ruled_out: number
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

// Mutations using server actions
export function useCreateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCaseReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['case-stats'] })
    },
  })
}

export function useUpdateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCaseReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

export function useDeleteCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCaseReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['case-stats'] })
    },
  })
}
```

---

### Step 7: Update Middleware (15 minutes)

Create `src/middleware.ts`:
```typescript
import { createServerClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request)

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from auth page
  if (request.nextUrl.pathname === '/auth' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### Step 8: Consolidate and Delete Old Files (30 minutes)

```bash
# Delete old duplicates
rm src/lib/api.ts
rm src/lib/api-optimized.ts

# Delete old pages directory (we're using App Router only)
rm -rf src/pages

# Keep only essential services
# Review and potentially delete:
# - src/services/caseReportService.ts (logic now in actions)
# - src/lib/syncService.ts (if not needed)
```

---

## ✅ Testing Checklist

After refactoring, test these:

### Authentication
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes redirect to auth
- [ ] Authenticated users can't access /auth

### Case Reporting
- [ ] Create new case report
- [ ] View list of cases
- [ ] View single case details
- [ ] Update case
- [ ] Delete case
- [ ] Filter cases by disease
- [ ] Filter cases by status

### Lab Results
- [ ] Create lab result
- [ ] Case status updates automatically
- [ ] View lab results

### Dashboard
- [ ] Statistics load correctly
- [ ] Recent cases display
- [ ] Loading states work
- [ ] No infinite loading

### Performance
- [ ] Dashboard loads in < 1 second
- [ ] Queries execute in < 100ms (check browser network tab)
- [ ] No unnecessary refetches

---

## 🚨 Troubleshooting

### Issue: Infinite Loading
**Fix:** Check if queries have proper `enabled` conditions and staleTime

### Issue: "Cannot read property of undefined"
**Fix:** Check if data destructuring has proper fallbacks: `data?.field`

### Issue: Server Actions not working
**Fix:** Ensure 'use server' directive is at top of file

### Issue: TypeScript errors
**Fix:** Run `npm run build` to regenerate types

---

## 📊 Performance Benchmarks

After refactoring, you should see:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard load | 3-5s | < 1s | 70-80% faster |
| Query response | 200-500ms | < 100ms | 50-75% faster |
| Bundle size | ~2MB | ~1.2MB | 40% smaller |
| Code lines | ~15,000 | ~9,000 | 40% reduction |

---

**Ready to start? Begin with Step 1: Database Optimizations**
