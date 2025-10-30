# 🪣 Storage Bucket Debug Guide

**Error:** `StorageApiError: Bucket not found`

---

## 🔍 Step-by-Step Verification

### STEP 1: Verify Bucket Name (90% of issues!)

**In Supabase Dashboard → Storage:**

Look at your bucket list. Is it named **exactly**:

```
case-attachments
```

**NOT:**
- ❌ `case_attachments` (underscore)
- ❌ `caseattachments` (no separator)
- ❌ `Case-Attachments` (capital letters)
- ❌ `case-attachment` (missing 's')

**If wrong name:**
1. Delete the bucket
2. Create new bucket: `case-attachments` (copy this exact name!)

---

### STEP 2: Check You're in Right Project

**Your app connects to:**
```
https://ralsdfqtgnmstkvmacdp.supabase.co
```

**In Supabase Dashboard:**
1. Check the URL in your browser
2. Should match: `app.supabase.com/project/ralsdfqtgnmstkvmacdp`
3. If different, you're in the wrong project!

---

### STEP 3: Run Storage Policies SQL

**Even if bucket exists, you need policies!**

1. Go to Supabase Dashboard → SQL Editor
2. Copy **entire** `fix_storage_bucket.sql`
3. Click **RUN**

**Expected output:**
- First query: Should show bucket details
- Policies: May say "already exists" (that's OK!)
- Last query: Should show 4 policies

**If first query returns empty:**
→ Bucket doesn't exist or has wrong name!

---

### STEP 4: Manual Bucket Creation (If Needed)

**If bucket doesn't exist, create it:**

1. **Supabase Dashboard → Storage**
2. Click **"New bucket"**
3. **IMPORTANT:** Copy this exact name: `case-attachments`
4. **Public bucket:** LEAVE UNCHECKED (keep private)
5. **File size limit:** Leave default (50MB)
6. Click **"Create bucket"**

---

### STEP 5: Set Policies Through UI (Alternative)

**If SQL doesn't work, use UI:**

1. Click on `case-attachments` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Select **"Custom"**

**Policy 1 - INSERT (Upload):**
```sql
Policy name: Authenticated users can upload
Allowed operation: INSERT
Target roles: authenticated
USING expression: true
WITH CHECK expression: (bucket_id = 'case-attachments')
```

**Policy 2 - SELECT (Read):**
```sql
Policy name: Authenticated users can read
Allowed operation: SELECT
Target roles: authenticated
USING expression: (bucket_id = 'case-attachments')
```

---

### STEP 6: Test Upload in Supabase UI

**Before testing in app, test in Supabase:**

1. Storage → `case-attachments` bucket
2. Click **"Upload file"**
3. Select any image
4. Should upload successfully!

**If this fails:**
→ Policies are wrong or bucket is misconfigured

---

### STEP 7: Restart Dev Server

**After fixing bucket:**

```bash
# Stop current server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

Sometimes Next.js caches Supabase client config.

---

## 🐛 Common Issues & Fixes

### Issue: "Bucket not found" even with correct name

**Cause:** Environment variables cached

**Fix:**
```bash
# Stop server
# Check .env.local
cat .env.local | grep SUPABASE

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://ralsdfqtgnmstkvmacdp.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# If wrong, fix it, then:
rm -rf .next
npm run dev
```

---

### Issue: "Access denied" instead of "Bucket not found"

**Good news:** Bucket exists!  
**Problem:** Missing policies

**Fix:** Run `fix_storage_bucket.sql` in SQL Editor

---

### Issue: "New bucket" button disabled

**Cause:** Free tier limit (usually 2 buckets max)

**Fix:** 
1. Delete unused buckets
2. Or upgrade plan
3. Or use existing bucket with different name in code

---

### Issue: SQL gives errors

**Check these:**

```sql
-- 1. Does bucket exist?
SELECT * FROM storage.buckets WHERE name = 'case-attachments';
-- Should return 1 row

-- 2. Do policies exist?
SELECT * FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'case-attachments');
-- Should return 4 rows (or 2 minimum)

-- 3. Can you access storage schema?
SELECT current_user;
-- Should show: authenticated or postgres
```

---

## ✅ Verification Checklist

After all fixes:

- [ ] Bucket named exactly `case-attachments`
- [ ] Bucket is in project `ralsdfqtgnmstkvmacdp`
- [ ] Bucket is PRIVATE (not public)
- [ ] At least 2 policies exist (INSERT + SELECT)
- [ ] Can upload file through Supabase UI
- [ ] Dev server restarted
- [ ] Can submit form without error

---

## 🎯 Quick Test

After fixes:

```bash
npm run dev
```

1. Go to `/dashboard/report`
2. Fill form
3. Click "Upload Photo" (or capture)
4. Select image
5. Should say: **"Photo captured"** ✅
6. Submit form
7. Should succeed without bucket error ✅

---

## 📞 If Still Not Working

**Last resort debugging:**

Add console logs to see what's happening:

In `src/components/forms/CaseReportForm.tsx` around line 223:

```typescript
console.log('Bucket name:', 'case-attachments');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('File to upload:', capturedPhoto);

const { data: uploadData, error: uploadError } = await supabase.storage
  .from('case-attachments')
  .upload(fileName, capturedPhoto);

console.log('Upload result:', { uploadData, uploadError });
```

Then check browser console for details.

---

## 🎓 Why This Happens

**Storage buckets are NOT created automatically!**

Unlike database tables (which are created via SQL), storage buckets must be:
1. Created through Supabase UI or API
2. Have explicit RLS policies set
3. Match exact name in code

**Think of it like AWS S3:**
- Bucket = S3 bucket (must create first)
- Files = S3 objects (can upload after bucket exists)
- Policies = IAM permissions (must set explicitly)

---

**Most likely fix: Just recreate bucket with exact name `case-attachments`** 🎯
