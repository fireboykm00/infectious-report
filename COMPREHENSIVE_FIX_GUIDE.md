# 🔧 Comprehensive Fix Guide - All Critical Issues

**Issues Found:**
1. ❌ Auth timeout causing redirects (useAuth.ts:181)
2. ❌ Lab results schema mismatch (test_date vs tested_at)
3. ❌ Admin can't manage users (RLS policy violation)
4. ❌ RBAC not working (all roles see same features)
5. ❌ Lab tech can only report cases (should manage lab results)

---

## 🎯 STEP 1: Run All SQL Fixes (10 minutes)

### A. Run fix_all_critical_issues.sql (MOST IMPORTANT!)

**Supabase Dashboard → SQL Editor → Run:**

This fixes:
- ✅ Lab results schema (test_date → tested_at)
- ✅ Admin RLS policies (can now manage users)
- ✅ RBAC functions (has_role, has_any_role)
- ✅ Role-based table access
- ✅ Performance indexes

**Expected output:**
```
✅ All critical issues fixed!
1. lab_results schema corrected
2. Admin can now manage users
3. RBAC functions created
4. Role-based access configured
5. Performance indexes added
```

### B. Run fix_missing_data.sql (If not done yet)

Adds:
- 20 disease codes
- 5 sample districts
- 3 sample facilities

### C. Run database_optimization.sql (If not done yet)

Adds:
- Performance indexes
- dashboard_stats() RPC function

---

## 🎯 STEP 2: Fix Auth Timeout Issue

The auth timeout happens because `useAuth` is taking too long. Let's simplify it:

**Update `src/hooks/useAuth.ts`** or **use new `src/features/auth/hooks.ts`** instead.

The new simplified version doesn't have complex role fetching logic.

**Quick fix in existing components:**

Replace:
```typescript
import { useAuth } from '@/hooks/useAuth'
```

With:
```typescript
import { useAuth, useUserRole } from '@/features/auth/hooks'
```

---

## 🎯 STEP 3: Configure Role-Based Features

### Create Role-Based Dashboard

**File: `src/app/dashboard/layout.tsx`**

Add this to show/hide menu items based on role:

```typescript
'use client'

import { useAuth, useUserRole } from '@/features/auth/hooks'
import { hasPermission } from '@/lib/rbac'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }) {
  const { user } = useAuth()
  const { role } = useUserRole()

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      show: true, // Everyone sees dashboard
    },
    {
      name: 'Report Case',
      href: '/dashboard/report',
      icon: 'FileText',
      show: hasPermission(role, 'cases', 'create'),
    },
    {
      name: 'Lab Results',
      href: '/dashboard/lab',
      icon: 'Beaker',
      show: hasPermission(role, 'lab_results', 'read'),
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: 'BarChart',
      show: hasPermission(role, 'analytics', 'read'),
    },
    {
      name: 'Outbreaks',
      href: '/dashboard/outbreaks',
      icon: 'AlertTriangle',
      show: hasPermission(role, 'outbreaks', 'read'),
    },
    {
      name: 'Admin',
      href: '/dashboard/admin',
      icon: 'Settings',
      show: hasPermission(role, 'admin_settings', 'read'),
    },
  ].filter(item => item.show)

  return (
    <div className="flex h-screen">
      <Sidebar items={menuItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

---

## 🎯 STEP 4: Fix Lab Technician Features

Lab technicians should be able to:
- ✅ View cases (read-only)
- ✅ Add lab results
- ✅ Update their lab results
- ❌ Not create case reports (reporters do this)

**Update Lab Results Page:**

```typescript
'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { useCreateLabResult } from '@/features/lab/hooks'

export default function LabResultsPage() {
  const createLab = useCreateLabResult()

  return (
    <div>
      <h1>Lab Results</h1>
      
      {/* Only lab techs and admins can add results */}
      <RoleGuard allowedRoles={['lab_tech', 'admin']}>
        <button onClick={() => {/* Open add form */}}>
          Add Lab Result
        </button>
      </RoleGuard>

      {/* Everyone can view */}
      <LabResultsList />
    </div>
  )
}
```

---

## 🎯 STEP 5: Fix Admin User Management

Admin should be able to:
- ✅ Create users
- ✅ Assign roles
- ✅ Delete users
- ✅ View all profiles

**Create Admin User Management Page:**

```typescript
// src/app/dashboard/admin/users/page.tsx
'use client'

import { RoleGuard, Unauthorized } from '@/components/auth/RoleGuard'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'
import { toast } from 'sonner'

export default function UserManagement() {
  const [users, setUsers] = useState([])

  // Create user (admin only)
  async function createUser(email: string, role: string) {
    try {
      // 1. Create auth user (you might need admin API for this)
      // 2. Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({ email, full_name: email })
        .select()
        .single()

      if (profileError) throw profileError

      // 3. Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.id, role })

      if (roleError) throw roleError

      toast.success('User created successfully!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Delete user
  async function deleteUser(userId: string) {
    try {
      // 1. Delete role
      await supabase.from('user_roles').delete().eq('user_id', userId)
      
      // 2. Delete profile
      await supabase.from('profiles').delete().eq('id', userId)

      toast.success('User deleted!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']} fallback={<Unauthorized />}>
      <div>
        <h1>User Management</h1>
        {/* Your user management UI */}
      </div>
    </RoleGuard>
  )
}
```

---

## 🎯 STEP 6: Role-Specific Features Summary

### Reporter
**Can:**
- ✅ Create case reports
- ✅ View their facility's cases
- ✅ Update their own reports

**Cannot:**
- ❌ View lab results
- ❌ View analytics
- ❌ Manage users

### Lab Technician
**Can:**
- ✅ View all cases (read-only)
- ✅ Add lab results
- ✅ Update their lab results

**Cannot:**
- ❌ Create case reports
- ❌ View analytics
- ❌ Manage users

### District Officer
**Can:**
- ✅ View all cases in their district
- ✅ Create/update cases
- ✅ View analytics (district level)
- ✅ Manage outbreaks
- ✅ Export data

**Cannot:**
- ❌ View other districts' data
- ❌ Manage users
- ❌ Delete cases

### National Officer
**Can:**
- ✅ View all national data
- ✅ View analytics (national level)
- ✅ Approve cases
- ✅ Manage outbreaks
- ✅ Export data

**Cannot:**
- ❌ Manage users (only admin can)

### Admin
**Can:**
- ✅ Everything above PLUS:
- ✅ Manage users
- ✅ Assign roles
- ✅ Delete anything
- ✅ System configuration

---

## 🎯 STEP 7: Testing Each Role

### Test as Reporter:
```bash
1. Login as reporter
2. Should see: Dashboard, Report Case
3. Should NOT see: Lab Results, Analytics, Admin
4. Create a case report → Should succeed ✅
```

### Test as Lab Tech:
```bash
1. Login as lab tech
2. Should see: Dashboard, Lab Results
3. Should NOT see: Report Case, Admin
4. Add lab result → Should succeed ✅
```

### Test as Admin:
```bash
1. Login as admin
2. Should see: ALL menu items
3. Go to Admin → Users
4. Create user → Should succeed ✅
5. Assign role → Should succeed ✅
6. Delete user → Should succeed ✅
```

---

## 🎯 STEP 8: Fix Specific Errors

### Error: "Could not find 'test_date' column"

**Fix:** Run `fix_all_critical_issues.sql`

This renames `test_date` to `tested_at` throughout the schema.

### Error: "Row violates row-level security policy for user_roles"

**Fix:** Run `fix_all_critical_issues.sql`

This updates RLS policies to allow admins to manage roles.

### Error: "Auth initialization timeout"

**Fix:** Use simplified auth hooks:

```typescript
// Instead of old useAuth
import { useAuth, useUserRole } from '@/features/auth/hooks'

function MyComponent() {
  const { user, loading } = useAuth()
  const { role } = useUserRole()
  
  if (loading) return <div>Loading...</div>
  
  return <div>User role: {role}</div>
}
```

---

## 🎯 STEP 9: Quick Verification

After all fixes, run this checklist:

```bash
# 1. Start dev server
npm run dev

# 2. Login as different roles and verify:

✅ Reporter can create cases
✅ Lab tech can add lab results (NOT create cases)
✅ District officer sees district data only
✅ National officer sees all data
✅ Admin can manage users

# 3. Check no errors in console
# 4. Check database has:
#    - 20 disease codes
#    - RLS policies for admin
#    - RBAC functions (has_role, has_any_role)
```

---

## 📊 Files Created for You

1. **`fix_all_critical_issues.sql`** ⚡ RUN THIS FIRST!
2. **`RoleGuard.tsx`** - Component for role-based rendering
3. **`rbac.ts`** - RBAC utility functions (already exists)
4. **`test_all_features.ts`** - Automated tests

---

## 🎓 Common Mistakes to Avoid

### Mistake 1: Not Running SQL Fixes
**Problem:** Trying to fix in code when database is misconfigured  
**Fix:** Always run SQL fixes first!

### Mistake 2: Using Wrong Auth Hook
**Problem:** Using old `useAuth` with timeout issues  
**Fix:** Use new `@/features/auth/hooks` version

### Mistake 3: Not Checking User Role
**Problem:** Showing features to everyone  
**Fix:** Use `<RoleGuard>` or `hasPermission()`

### Mistake 4: Hardcoding Roles
**Problem:** Using `if (role === 'admin')` everywhere  
**Fix:** Use `hasPermission(role, resource, action)`

---

## 📞 Still Having Issues?

### Issue: "SQL errors when running fix"

Check:
- Are you connected to correct Supabase project?
- Do you have database permissions?
- Try running queries one at a time

### Issue: "Role not showing in UI"

Check:
- Is user_roles table populated for this user?
- Run: `SELECT * FROM user_roles WHERE user_id = 'USER_ID'`
- If empty, manually insert role

### Issue: "RoleGuard not working"

Check:
- Did you run `fix_all_critical_issues.sql`?
- Are RBAC functions created?
- Check browser console for errors

---

## ✅ Success Criteria

After all fixes:

- [ ] No auth timeout errors
- [ ] Lab tech can add lab results
- [ ] Admin can create/delete users
- [ ] Each role sees correct menu items
- [ ] No "test_date" column errors
- [ ] No RLS policy violations
- [ ] All CRUD operations work

---

**Next: Run `fix_all_critical_issues.sql` in Supabase SQL Editor!** 🚀
