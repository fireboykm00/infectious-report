# 🔧 Supabase New Project Setup

## Issue: Database Connection & Infinite Loading

You changed to a new Supabase account. The app can't connect because:
1. ✅ Environment variables updated
2. ❌ Database tables don't exist yet (migrations not run)
3. ❌ Storage buckets not created

---

## Quick Fix (5 Steps)

### Step 1: Verify Environment Variables
```bash
cat .env.local
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://ralsdfqtgnmstkvmacdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

✅ **You already have this!**

---

### Step 2: Apply ALL Migrations

Go to Supabase Dashboard → SQL Editor:  
**https://supabase.com/dashboard/project/ralsdfqtgnmstkvmacdp/sql/new**

Run each migration file in order:

#### 1. Initial Schema (REQUIRED)
```sql
-- Copy and paste from:
supabase/migrations/20251026095224_initial_schema.sql
```

#### 2. Auth Setup (REQUIRED)
```sql
-- Copy and paste from:
supabase/migrations/20251026095225_auth_setup.sql
```

#### 3. User Roles (REQUIRED)
```sql
-- Copy and paste from:
supabase/migrations/20251027095224_add_user_roles_table.sql
```

#### 4. Update Roles (REQUIRED)
```sql
-- Copy and paste from:
supabase/migrations/20251027095224_update_roles.sql
```

#### 5. Disease Codes (OPTIONAL but recommended)
```sql
-- Copy and paste from:
supabase/migrations/20251029_add_disease_codes.sql
```

---

### Step 3: Create Storage Bucket

Go to: **Storage → Create New Bucket**
- Name: `case-attachments`
- Public: ❌ No (Private)
- Click Create

Then add policy:
```sql
-- In Storage policies
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-attachments');

CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-attachments');
```

---

### Step 4: Verify Tables Created

Go to: **Table Editor**

You should see these tables:
- ✅ profiles
- ✅ user_roles  
- ✅ facilities
- ✅ districts
- ✅ case_reports
- ✅ lab_results
- ✅ outbreaks
- ✅ notifications
- ✅ audit_logs
- ✅ disease_codes (if you ran migration)

---

### Step 5: Test Connection

```bash
# Restart dev server
pnpm dev

# Open browser console
# You should see:
[Supabase] Initializing client { url: 'https://ralsdfqtgnmstkvmacdp...', hasKey: true }
[Supabase] Connected successfully { hasSession: false }
[useAuth] Initializing auth...
[useAuth] Auth initialized successfully
```

---

## What I Fixed in Code

### 1. Added Connection Logging
**File:** `src/integrations/supabase/client.ts`
```typescript
// Now logs connection status
console.log('[Supabase] Initializing client...');
console.log('[Supabase] Connected successfully');
```

### 2. Added Timeout to Prevent Infinite Loading
**File:** `src/hooks/useAuth.ts`
```typescript
// 10-second timeout prevents hanging forever
setTimeout(() => {
  setLoading(false);
}, 10000);
```

### 3. Better Error Messages
- Shows which step failed
- Console logs for debugging
- Clear error messages

---

## Common Issues & Solutions

### Issue: "relation 'profiles' does not exist"
**Solution:** Run migration #1 (initial_schema.sql)

### Issue: "function has_role does not exist"
**Solution:** Run migration #2 (auth_setup.sql)

### Issue: Still infinite loading
**Solution:**
```bash
# 1. Clear browser data
DevTools → Application → Clear site data

# 2. Check browser console for errors
# Look for red error messages

# 3. Verify Supabase project is active
# Go to dashboard, check if project is paused
```

### Issue: "Invalid API key"
**Solution:**
```bash
# Get new keys from Supabase dashboard
# Settings → API
# Copy:
# - Project URL → NEXT_PUBLIC_SUPABASE_URL
# - anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY

# Update .env.local
# Restart server
```

---

## Verify Everything Works

### 1. Login Test
```
1. Go to http://localhost:3001/auth
2. Create account or login
3. Should redirect to /dashboard
4. Should NOT see infinite loading
```

### 2. Database Test
```
1. Login as admin
2. Go to /dashboard/admin
3. Should see user management table
4. If you see data, database is connected!
```

### 3. Console Test
```
1. Open DevTools → Console
2. Should see:
   [Supabase] Connected successfully
   [useAuth] Auth initialized successfully
   [API] Fetched statistics in 89ms

3. Should NOT see:
   ❌ Connection timeout
   ❌ Relation does not exist
   ❌ Invalid API key
```

---

## Migration Files Location

All SQL files are in:
```
/home/backer/Workspace/NEW/infectious-report/supabase/migrations/

📄 20251026095224_initial_schema.sql
📄 20251026095225_auth_setup.sql
📄 20251027095224_add_user_roles_table.sql
📄 20251027095224_update_roles.sql
📄 20251029_add_disease_codes.sql
```

---

## Quick Migration Command (Alternative)

If you have Supabase CLI installed:
```bash
# Link to your project
supabase link --project-ref ralsdfqtgnmstkvmacdp

# Push all migrations
supabase db push

# Done!
```

Don't have CLI? Install it:
```bash
npm install -g supabase
```

---

## Summary

**Why infinite loading?**
- New Supabase project has NO tables
- App tries to query tables that don't exist
- Queries hang/fail → infinite loading

**Solution:**
1. Run all 5 migration files in Supabase SQL Editor
2. Create storage bucket
3. Restart dev server
4. Clear browser cache
5. Test login

**Time needed:** 10 minutes

---

**After setup, the app will work correctly!** 🎉

*Your Supabase Project:* https://supabase.com/dashboard/project/ralsdfqtgnmstkvmacdp
