# 🎯 How to Use the New Structure

**Updated:** October 30, 2025  
**Status:** Refactoring Complete

---

## 🗂️ New Folder Structure

```
src/
├── features/               # Feature-based organization
│   ├── auth/
│   │   └── hooks.ts       # useAuth, useRequireAuth, useUserRole
│   ├── cases/
│   │   ├── actions.ts     # Server actions for mutations
│   │   └── hooks.ts       # Client hooks for queries
│   └── lab/
│       ├── actions.ts
│       └── hooks.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser client (use in Client Components)
│   │   ├── server.ts      # Server client (use in Server Actions)
│   │   └── middleware.ts  # Middleware client
│   └── validations/       # Zod schemas
│       ├── case.ts
│       ├── lab.ts
│       └── auth.ts
└── middleware.ts          # Route protection
```

---

## 📚 Usage Examples

### 1. Creating a Case Report (Full Flow)

#### Step 1: In your Client Component

```typescript
'use client'

import { useCreateCase } from '@/features/cases/hooks'
import { toast } from 'sonner'

export function CaseReportForm() {
  const createCase = useCreateCase()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      disease_code: formData.get('disease_code'),
      age_group: formData.get('age_group'),
      gender: formData.get('gender'),
      symptoms: formData.get('symptoms'),
      location_detail: formData.get('location_detail'),
      district_id: formData.get('district_id'),
      status: 'suspected',
    }

    const result = await createCase.mutateAsync(data)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Case reported successfully!')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button 
        type="submit" 
        disabled={createCase.isPending}
      >
        {createCase.isPending ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  )
}
```

#### What Happens Behind the Scenes:

1. **Client Component** calls `createCase.mutateAsync(data)`
2. **Hook** (`useCreateCase`) calls the **Server Action** (`createCaseReport`)
3. **Server Action** validates data with Zod schema
4. **Server Action** inserts into Supabase
5. **Server Action** revalidates cache
6. **Hook** invalidates TanStack Query cache
7. UI updates automatically

---

### 2. Fetching Cases

```typescript
'use client'

import { useCases, useCaseStats } from '@/features/cases/hooks'

export function CasesDashboard() {
  // Fetch cases with optional filters
  const { data: cases, isLoading } = useCases({
    disease: 'COVID',  // optional filter
    status: 'confirmed',  // optional filter
  })

  // Fetch stats using RPC function (fast!)
  const { data: stats } = useCaseStats()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Total Cases: {stats?.total_cases}</h1>
      <h2>Confirmed: {stats?.confirmed_cases}</h2>
      
      <ul>
        {cases?.map(c => (
          <li key={c.id}>{c.disease_code} - {c.status}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

### 3. Authentication

```typescript
'use client'

import { useAuth, useRequireAuth } from '@/features/auth/hooks'
import { useRouter } from 'next/navigation'

// Simple auth check
export function MyComponent() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return <div>Welcome {user.email}</div>
}

// Auto-redirect if not authenticated
export function ProtectedPage() {
  const { user, loading } = useRequireAuth() // Redirects if not logged in

  if (loading) return <div>Loading...</div>

  return <div>Protected content for {user?.email}</div>
}
```

---

### 4. Lab Results

```typescript
'use client'

import { useCreateLabResult, usePendingLabCases } from '@/features/lab/hooks'

export function LabForm() {
  const createLab = useCreateLabResult()
  const { data: pendingCases } = usePendingLabCases()

  const handleSubmit = async (caseId: string, result: 'positive' | 'negative') => {
    const data = {
      case_report_id: caseId,
      test_type: 'PCR',
      result: result,
      tested_at: new Date().toISOString(),
      notes: 'Lab notes here',
    }

    const res = await createLab.mutateAsync(data)
    
    if (res.success) {
      toast.success('Lab result saved!')
      // Case status will be automatically updated
    }
  }

  return (
    <div>
      <h2>Pending Lab Cases: {pendingCases?.length}</h2>
      {/* Your lab form UI */}
    </div>
  )
}
```

---

## ⚙️ When to Use What

### Use **Client-Side Hooks** (`useCases`, `useLabResults`) for:
- ✅ Reading data in Client Components
- ✅ Real-time updates
- ✅ Interactive UI
- ✅ Filtering and searching

### Use **Server Actions** (`createCaseReport`, `createLabResult`) for:
- ✅ Creating/updating/deleting data
- ✅ Validation before database writes
- ✅ Secure operations (user must be authenticated)
- ✅ Operations that need server-side logic

### Use **Server Components** with `createServerClient()` for:
- ✅ Initial data loading (faster)
- ✅ SEO-critical content
- ✅ Reducing client JavaScript

---

## 🔒 Authentication Patterns

### Pattern 1: Middleware Protection (Automatic)

```typescript
// src/middleware.ts already handles this!
// All /dashboard/* routes are protected automatically
// Users are redirected to /auth if not logged in
```

### Pattern 2: Component-Level Protection

```typescript
import { useRequireAuth } from '@/features/auth/hooks'

export function ProtectedComponent() {
  useRequireAuth() // Auto-redirects if not authenticated
  
  // Rest of your component
}
```

### Pattern 3: Conditional Rendering

```typescript
import { useAuth } from '@/features/auth/hooks'

export function NavBar() {
  const { user } = useAuth()

  return (
    <nav>
      {user ? (
        <button>Logout</button>
      ) : (
        <button>Login</button>
      )}
    </nav>
  )
}
```

---

## 📊 Performance Tips

### 1. Use RPC Functions for Statistics

```typescript
// ❌ SLOW: Fetch all cases and count client-side
const { data: cases } = useCases()
const total = cases?.length // Fetches thousands of rows

// ✅ FAST: Use RPC function
const { data: stats } = useCaseStats()
const total = stats?.total_cases // Only fetches aggregated result
```

### 2. Select Only Needed Fields

```typescript
// Already optimized in hooks!
// useCases() only fetches: id, disease_code, status, created_at, location_detail
// useCaseById() fetches all fields for detail view
```

### 3. Use Filters to Reduce Data

```typescript
// Fetch only what you need
const { data } = useCases({
  disease: 'COVID',
  status: 'confirmed',
  dateFrom: '2025-10-01',
})
```

---

## 🧪 Testing Your Changes

### 1. Run Database Optimization

```bash
# Go to Supabase Dashboard → SQL Editor
# Run: database_optimization.sql
```

### 2. Test Case Creation

```bash
npm run dev

# Navigate to /dashboard/report
# Fill out form
# Submit
# Check: Dashboard should update immediately
```

### 3. Test Authentication

```bash
# Logout
# Try to access /dashboard
# Should redirect to /auth
# Login
# Should redirect back to /dashboard
```

### 4. Check Performance

```bash
# Open Browser DevTools → Network tab
# Load dashboard
# Check query time (should be < 100ms)
# Check bundle size (should be ~1.2MB)
```

---

## 🐛 Troubleshooting

### Issue: "Property 'rpc' does not exist"

**Solution:** The RPC function isn't in generated types yet. Use `as any`:

```typescript
await supabase.rpc('dashboard_stats' as any, { p_district_id: null })
```

### Issue: "Cookies is not a function"

**Solution:** Make sure you're using `await` with `createServerClient()`:

```typescript
// ❌ Wrong
const supabase = createServerClient()

// ✅ Correct
const supabase = await createServerClient()
```

### Issue: "Mutations not working"

**Solution:** Check if server action has `'use server'` directive:

```typescript
'use server'  // ← Must be at top of file!

export async function createCaseReport(data) {
  // ...
}
```

### Issue: "Infinite loading"

**Solution:** Check TanStack Query config in `providers.tsx`:

```typescript
staleTime: 1000 * 60 * 5,  // 5 minutes
refetchOnWindowFocus: false,  // Important!
```

---

## 📝 Quick Reference

### Import Paths

```typescript
// Hooks (Client Components)
import { useCases, useCaseStats, useCreateCase } from '@/features/cases/hooks'
import { useAuth, useRequireAuth } from '@/features/auth/hooks'
import { useLabResults, useCreateLabResult } from '@/features/lab/hooks'

// Actions (call from Client Components)
import { createCaseReport, updateCaseReport } from '@/features/cases/actions'
import { createLabResult } from '@/features/lab/actions'

// Supabase Clients
import { supabase } from '@/integrations/supabase/client' // Browser
import { createServerClient } from '@/lib/supabase/server' // Server

// Validation
import { caseReportSchema } from '@/lib/validations/case'
import { labResultSchema } from '@/lib/validations/lab'
```

### Common Operations

```typescript
// Create case
const createCase = useCreateCase()
await createCase.mutateAsync(data)

// Fetch cases
const { data, isLoading } = useCases({ disease: 'COVID' })

// Get single case
const { data: case } = useCaseById(id)

// Get stats (fast!)
const { data: stats } = useCaseStats()

// Check auth
const { user, loading } = useAuth()

// Require auth (with redirect)
useRequireAuth()
```

---

## ✅ Migration Checklist

If migrating old code:

- [ ] Replace direct Supabase calls with hooks
- [ ] Move mutations to server actions
- [ ] Add validation with Zod schemas
- [ ] Use `useAuth()` instead of old `useAuth` hook
- [ ] Test all CRUD operations
- [ ] Check performance in Network tab
- [ ] Verify authentication works
- [ ] Run database optimization SQL

---

## 🎓 Best Practices

1. **Always validate** with Zod before submitting to server
2. **Use hooks** for queries, **server actions** for mutations
3. **Add loading states** for better UX
4. **Handle errors** gracefully with toast notifications
5. **Test in both** online and offline modes
6. **Check performance** regularly in DevTools
7. **Keep components small** and focused (Single Responsibility)
8. **Reuse logic** with custom hooks (DRY principle)

---

## 📞 Need Help?

Check these files:
- `REFACTORING_PLAN.md` - Complete architecture design
- `REFACTORING_EXECUTION.md` - Detailed implementation guide
- `REFACTOR_SUMMARY.md` - Executive overview

---

**You're all set! The new structure is cleaner, faster, and easier to maintain.** 🚀
