# IDSR Platform - Comprehensive Refactoring Plan

**Created:** October 30, 2025  
**Goal:** Simplify architecture, reduce complexity, improve performance, make all features functional

---

## 🔍 Current Problems Identified

### 1. **Architectural Complexity**
- ❌ Duplicate API files: `api.ts` and `api-optimized.ts` - creating confusion
- ❌ Mixed Next.js App Router + Pages directory structure
- ❌ Scattered business logic between hooks, services, and lib files
- ❌ No clear separation between server and client code

### 2. **Data Layer Issues**
- ❌ Direct Supabase queries in hooks (tight coupling)
- ❌ Complex TanStack Query configurations causing issues
- ❌ No centralized data validation layer
- ❌ Redundant query keys and cache invalidation logic

### 3. **Performance Problems**
- ❌ Over-fetching data (selecting * instead of specific fields)
- ❌ No proper request deduplication
- ❌ Supabase queries can be slow due to complexity
- ❌ Missing database indexes

### 4. **Code Organization**
- ❌ Business logic mixed with UI components
- ❌ Violates SOLID principles (especially Single Responsibility)
- ❌ Duplicate code (violates DRY principle)
- ❌ Unclear folder structure

### 5. **Supabase-Specific Issues**
- ⚠️ Supabase can be slow for complex queries
- ⚠️ RLS policies add overhead
- ⚠️ No type-safe query builder
- ✅ But: Authentication is good, real-time is good, free tier generous

---

## 🎯 Decision: Keep Supabase or Switch to Prisma?

### Recommendation: **KEEP SUPABASE** ✅

**Why?**
1. **Authentication is already working** - switching would require rebuilding auth
2. **Real-time features** - Supabase has built-in real-time subscriptions
3. **Free tier is generous** - Good for MVP
4. **Storage included** - For case attachments
5. **Time cost** - Migration to Prisma + Neon would take 2-3 days

**But Fix:**
- ✅ Simplify queries
- ✅ Add proper indexes
- ✅ Use RPC functions for complex operations
- ✅ Add caching layer

---

## 📋 Refactoring Strategy

### Phase 1: Clean Up & Consolidate (Day 1)

#### 1.1 Folder Structure Refactor
```
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Auth group routes
│   │   └── auth/
│   │       └── page.tsx
│   ├── (dashboard)/              # Dashboard group routes
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   └── dashboard/
│   │       ├── page.tsx          # Main dashboard
│   │       ├── report/
│   │       ├── analytics/
│   │       ├── lab/
│   │       ├── outbreaks/
│   │       └── admin/
│   ├── api/                      # API routes (if needed)
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
│
├── features/                     # Feature-based organization
│   ├── auth/
│   │   ├── components/           # Auth-specific components
│   │   ├── hooks/                # useAuth, useSession
│   │   ├── actions.ts            # Server actions
│   │   └── types.ts
│   ├── cases/
│   │   ├── components/           # CaseReportForm, CaseList, etc.
│   │   ├── hooks/                # useCases, useCaseStats
│   │   ├── actions.ts            # Server actions for CRUD
│   │   ├── queries.ts            # Query functions
│   │   └── types.ts
│   ├── lab/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── actions.ts
│   │   └── types.ts
│   ├── outbreaks/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── actions.ts
│   │   └── types.ts
│   └── analytics/
│       ├── components/
│       ├── hooks/
│       └── queries.ts
│
├── lib/                          # Shared utilities
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── middleware.ts         # Middleware client
│   │   └── types.ts              # Generated types
│   ├── validations/              # Zod schemas
│   │   ├── case.ts
│   │   ├── lab.ts
│   │   └── auth.ts
│   ├── rbac.ts                   # Authorization logic
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # App constants
│
├── components/                   # Shared components
│   ├── ui/                       # shadcn components
│   ├── layout/                   # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   └── shared/                   # Shared business components
│       ├── DataTable.tsx
│       └── StatusBadge.tsx
│
└── types/                        # Global types
    └── index.ts
```

#### 1.2 Delete Unnecessary Files
- ❌ Remove `src/pages/*` (use App Router only)
- ❌ Delete `api.ts` (keep only simplified version)
- ❌ Remove `api-optimized.ts` (merge best parts into new structure)
- ❌ Delete unused service files
- ❌ Remove redundant hooks

---

### Phase 2: Simplify Data Layer (Day 1-2)

#### 2.1 Create Server Actions (Next.js 15 Pattern)
Use **Server Actions** for mutations, keep queries on client with TanStack Query

**Example: `src/features/cases/actions.ts`**
```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { caseReportSchema } from '@/lib/validations/case'

export async function createCaseReport(formData: FormData) {
  const supabase = createServerClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Parse and validate
  const data = Object.fromEntries(formData)
  const validated = caseReportSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: validated.error.flatten() }
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
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { data: caseReport }
}
```

#### 2.2 Simplify TanStack Query Hooks
Keep queries simple, use server actions for mutations

**Example: `src/features/cases/hooks.ts`**
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'

export function useCases(filters?: CaseFilters) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      const supabase = createBrowserClient()
      let query = supabase
        .from('case_reports')
        .select('id, disease_code, status, created_at, location_detail')
        .order('created_at', { ascending: false })
        .limit(20)

      if (filters?.disease) {
        query = query.eq('disease_code', filters.disease)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
```

#### 2.3 Add Validation Layer with Zod
Create schemas for all entities

**Example: `src/lib/validations/case.ts`**
```typescript
import { z } from 'zod'

export const caseReportSchema = z.object({
  disease_code: z.string().min(1, 'Disease is required'),
  age_group: z.enum(['0-5', '6-17', '18-49', '50-64', '65+']),
  gender: z.enum(['male', 'female', 'other']),
  symptoms: z.string().min(10, 'Please describe symptoms'),
  location_detail: z.string().min(1, 'Location is required'),
  district_id: z.string().uuid(),
  status: z.enum(['suspected', 'confirmed', 'ruled_out', 'pending_lab']).default('suspected'),
  notes: z.string().optional(),
})

export type CaseReportInput = z.infer<typeof caseReportSchema>
```

---

### Phase 3: Performance Optimizations (Day 2)

#### 3.1 Add Database Indexes
Run this SQL in Supabase:
```sql
-- Performance indexes
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

-- Composite index for common query
CREATE INDEX IF NOT EXISTS idx_case_reports_status_date 
  ON case_reports(status, created_at DESC);
```

#### 3.2 Use Postgres Functions for Complex Queries
For analytics, use RPC functions instead of client-side aggregation

**Example: `dashboard_stats` function**
```sql
CREATE OR REPLACE FUNCTION dashboard_stats(p_district_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_cases', COUNT(*),
    'confirmed_cases', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'active_outbreaks', (SELECT COUNT(*) FROM outbreaks WHERE status = 'active')
  )
  INTO result
  FROM case_reports
  WHERE (p_district_id IS NULL OR district_id = p_district_id)
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

#### 3.3 Optimize TanStack Query Config
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min
      gcTime: 1000 * 60 * 30,          // 30 min (renamed from cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
})
```

---

### Phase 4: Simplify Authentication (Day 2)

#### 4.1 Create Middleware for Route Protection
**`src/middleware.ts`**
```typescript
import { createServerClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Redirect to dashboard if logged in and trying to access auth
  if (request.nextUrl.pathname === '/auth' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth'],
}
```

#### 4.2 Simplified useAuth Hook
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, loading }
}
```

---

### Phase 5: Fix TanStack Query Issues (Day 3)

#### Common Issues & Fixes:

1. **Infinite Loading** ✅ Fixed by:
   - Setting proper staleTime and gcTime
   - Using `enabled` option to prevent premature fetching
   - Adding loading timeouts

2. **Cache Invalidation** ✅ Fixed by:
   - Using server actions with `revalidatePath`
   - Simplified query keys
   - Remove manual invalidation where possible

3. **Refetch Issues** ✅ Fixed by:
   - `refetchOnWindowFocus: false`
   - `refetchOnReconnect: false`
   - Use manual refetch only when needed

---

### Phase 6: Apply SOLID & DRY Principles (Day 3)

#### SOLID Principles Applied:

**S - Single Responsibility**
- ✅ Each component does one thing
- ✅ Separate data fetching from UI
- ✅ Use composition over inheritance

**O - Open/Closed**
- ✅ Use generic components with props
- ✅ Extend behavior through composition

**L - Liskov Substitution**
- ✅ Use TypeScript interfaces properly

**I - Interface Segregation**
- ✅ Small, focused interfaces
- ✅ Don't force components to depend on unused props

**D - Dependency Inversion**
- ✅ Depend on abstractions (hooks) not concrete implementations
- ✅ Inject dependencies via props

#### DRY Principles:

1. **Extract Reusable Components**
```typescript
// Before: Duplicate badge logic everywhere
<Badge variant={status === 'confirmed' ? 'default' : 'secondary'}>
  {status}
</Badge>

// After: StatusBadge component
<StatusBadge status={status} />
```

2. **Create Custom Hooks**
```typescript
// Instead of repeating auth logic
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  return { user, loading }
}
```

3. **Centralize Constants**
```typescript
// src/lib/constants.ts
export const AGE_GROUPS = ['0-5', '6-17', '18-49', '50-64', '65+'] as const
export const CASE_STATUSES = ['suspected', 'confirmed', 'ruled_out', 'pending_lab'] as const
```

---

## 🚀 Implementation Order

### Week 1: Foundation
1. ✅ Create new folder structure
2. ✅ Add validation schemas
3. ✅ Create server actions for mutations
4. ✅ Simplify hooks for queries
5. ✅ Add database indexes
6. ✅ Remove old files

### Week 2: Features
7. ✅ Refactor case reporting
8. ✅ Refactor dashboard
9. ✅ Refactor lab module
10. ✅ Refactor analytics
11. ✅ Test all CRUD operations

### Week 3: Polish
12. ✅ Performance testing
13. ✅ Error handling
14. ✅ Loading states
15. ✅ Documentation
16. ✅ Deploy

---

## 📊 Expected Results

### Performance Improvements:
- 🚀 60-80% faster queries (with indexes)
- 🚀 90% reduction in over-fetching
- 🚀 50% smaller bundle size
- 🚀 Better caching = less network requests

### Code Quality:
- ✅ 40% less code (removing duplicates)
- ✅ Clear separation of concerns
- ✅ Easy to test
- ✅ Easy to extend
- ✅ Type-safe end-to-end

### Developer Experience:
- ✅ Clear folder structure
- ✅ Know where to add new features
- ✅ Less cognitive load
- ✅ Faster onboarding

---

## ⚠️ What NOT to Change

1. ✅ Keep Supabase (don't switch to Prisma)
2. ✅ Keep database schema (it's well designed)
3. ✅ Keep UI components (shadcn is good)
4. ✅ Keep Next.js 15 (latest is best)
5. ✅ Keep TanStack Query (just fix usage)

---

## 🎯 Success Criteria

- [ ] All CRUD operations working
- [ ] No TanStack Query errors
- [ ] Dashboard loads in < 1 second
- [ ] Case submission works offline
- [ ] All features from PROJECT_STATUS.md working
- [ ] Clean, organized codebase
- [ ] < 100ms query response time (with indexes)
- [ ] Zero TypeScript errors

---

**Next Step:** Start implementation with Phase 1 folder structure refactor
