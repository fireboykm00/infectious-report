# Database Initialization Guide

## ⚠️ Important: Auth Users vs Public Tables

**Why you can still login after dropping tables:**

```
auth.users          ← Supabase Auth (separate schema)
  ↓
public.profiles     ← Your app data (public schema) ❌ Missing!
public.user_roles   ← Your app data (public schema) ❌ Missing!
```

When you login, **Supabase Auth works** (auth.users table is separate).  
But your app tries to fetch **profile and role** from `public` schema → **FAILS!**

---

## 🚀 Complete Initialization (5 Minutes)

### Step 1: Run the Complete SQL

**File:** `COMPLETE_INIT.sql`

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/ralsdfqtgnmstkvmacdp/sql/new
   ```

2. Copy entire `COMPLETE_INIT.sql` file

3. Paste and click **RUN**

4. You should see output like:
   ```
   NOTICE:  Found user ID: fa32647c-8667-4272-9871-cb6e05d1a516
   NOTICE:  Profile and admin role created for user: fa32647c-...
   
   table_name      | count
   ----------------|------
   Districts:      | 3
   Facilities:     | 5
   Disease Codes:  | 15
   Profiles:       | 1
   User Roles:     | 1
   ```

---

## ✅ What Gets Created

### Tables (10 total)
1. ✅ `districts` - Geographic regions
2. ✅ `facilities` - Health facilities
3. ✅ `disease_codes` - WHO IDSR diseases
4. ✅ `profiles` - User profiles
5. ✅ `user_roles` - User permissions (RBAC)
6. ✅ `case_reports` - Disease case reports
7. ✅ `lab_results` - Laboratory test results
8. ✅ `outbreaks` - Outbreak tracking
9. ✅ `notifications` - User notifications
10. ✅ `audit_logs` - Activity audit trail

### Reference Data

**Districts (3):**
- Gasabo (Kigali City) - 530,907 pop
- Kicukiro (Kigali City) - 318,787 pop
- Nyarugenge (Kigali City) - 284,561 pop

**Facilities (5):**
- Kigali University Teaching Hospital (Referral)
- King Faisal Hospital (Referral)
- Kicukiro District Hospital (District)
- Nyarugenge Health Center (Health Center)
- Remera Health Center (Health Center)

**Disease Codes (15):**
- CHOL - Cholera
- MEAS - Measles
- COVID - COVID-19
- MALA - Malaria
- EBOLA - Ebola Virus Disease
- YELFEV - Yellow Fever
- MENIN - Meningococcal Meningitis
- AFP - Acute Flaccid Paralysis
- RABIES - Rabies
- TYPHOID - Typhoid Fever
- TB - Tuberculosis
- HIV - HIV/AIDS
- DENG - Dengue Fever
- ANTX - Anthrax
- PLAGU - Plague

### User Initialization

**Automatic:**
- ✅ Finds your existing auth user (from `auth.users`)
- ✅ Creates profile in `public.profiles`
- ✅ Assigns admin role in `public.user_roles`

---

## 🔍 Verify Everything Works

### Check in SQL Editor:

```sql
-- 1. Check your user has profile and role
SELECT 
  u.id,
  u.email,
  p.full_name,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id;
```

**Expected result:**
```
id                  | email                       | full_name              | role
--------------------|----------------------------|------------------------|-------
fa32647c-8667-...   | your@email.com             | System Administrator   | admin
```

If `full_name` or `role` is `NULL`, your profile/role wasn't created!

---

### Check in Your App:

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. Go to: http://localhost:3000

3. Login with your credentials

4. **Should see:**
   - ✅ Dashboard loads (no infinite spinner)
   - ✅ Sidebar shows all admin pages
   - ✅ No "Cannot coerce to single JSON object" error
   - ✅ Profile page shows your name
   - ✅ Case report page loads
   - ✅ Disease dropdown populates

5. **Check browser console:**
   ```
   [useAuth] User role: admin
   [useAuth] Auth initialized successfully
   ```

---

## 🐛 Troubleshooting

### Error: "Cannot coerce result to single JSON object"

**Cause:** Your user has no record in `profiles` or `user_roles` table.

**Fix:**
```sql
-- Replace YOUR_USER_ID with your actual ID from auth.users
INSERT INTO public.profiles (id, full_name, phone, is_active)
VALUES ('YOUR_USER_ID', 'Your Name', '+250788000000', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id) DO NOTHING;
```

---

### Error: "relation does not exist"

**Cause:** Tables weren't created.

**Fix:** Run `COMPLETE_INIT.sql` again (it's idempotent).

---

### Error: "duplicate key value violates unique constraint"

**Cause:** Data already exists (this is fine!).

**Fix:** Ignore - the SQL uses `ON CONFLICT DO NOTHING` for safety.

---

### No diseases in dropdown

**Cause:** `disease_codes` table empty.

**Fix:**
```sql
SELECT COUNT(*) FROM public.disease_codes;
-- Should return 15
```

If 0, run STEP 7 from `COMPLETE_INIT.sql` again.

---

### Can't see admin pages in sidebar

**Cause:** User role not set correctly.

**Fix:**
```sql
-- Check current role
SELECT role FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);

-- Update to admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);
```

---

## 📋 Dependency Order (Why Order Matters)

```
1. Extensions (uuid-ossp, pgcrypto)
   ↓
2. Enums (app_role, case_status, outbreak_status)
   ↓
3. Districts (no dependencies)
   ↓
4. Facilities (depends on districts)
   ↓
5. Disease Codes (independent)
   ↓
6. Profiles (depends on auth.users + facilities)
   ↓
7. User Roles (depends on auth.users)
   ↓
8. Case Reports (depends on users, facilities, districts, disease_codes)
   ↓
9. Lab Results (depends on case_reports, users, facilities)
   ↓
10. Outbreaks (depends on disease_codes, users)
```

**Breaking this order will cause foreign key errors!**

---

## 🔐 Security (RLS Policies)

All tables have Row Level Security (RLS) enabled:

- ✅ Users can only view/edit their own profile
- ✅ Users can only view their own role
- ✅ All authenticated users can read disease codes
- ✅ All authenticated users can create/view case reports
- ✅ Lab techs can create lab results

---

## 🎯 Next Steps After Initialization

1. **Test login:** http://localhost:3000/auth
2. **Create a case report:** Dashboard → Report Case
3. **View analytics:** Dashboard → Overview
4. **Add more users:** Supabase Dashboard → Authentication
5. **Assign roles:** Update `user_roles` table for new users

---

## 📝 Adding New Users

### Via Supabase Dashboard:

1. Go to: Authentication → Users → Add User
2. Enter email + password
3. Click **Create User**
4. Copy the User ID

### Then run this SQL:

```sql
-- Replace values with actual data
INSERT INTO public.profiles (id, full_name, phone, facility_id, is_active)
VALUES (
  'USER_ID_FROM_STEP_4',
  'John Doe',
  '+250788123456',
  (SELECT id FROM facilities WHERE name = 'King Faisal Hospital'),
  true
);

INSERT INTO public.user_roles (user_id, role)
VALUES (
  'USER_ID_FROM_STEP_4',
  'reporter'  -- or 'lab_tech', 'district_officer', 'national_officer', 'admin'
);
```

---

## ✅ Checklist

After running `COMPLETE_INIT.sql`:

- [ ] All 10 tables created
- [ ] 3 districts inserted
- [ ] 5 facilities inserted
- [ ] 15 disease codes inserted
- [ ] Your profile created
- [ ] Your admin role assigned
- [ ] App loads without errors
- [ ] Dashboard displays correctly
- [ ] Can create case reports
- [ ] Disease dropdown works
- [ ] Sidebar shows all pages

---

**Status:** 🟢 Ready to use!

**Support:** Check `DATABASE_SCHEMA.md` for full schema documentation
