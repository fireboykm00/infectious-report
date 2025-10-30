# 🔧 Form Issues & Fixes

## Problems Found:

1. ❌ **Disease codes table empty** → Foreign key error
2. ❌ **Storage bucket missing** → Photo upload fails
3. ❌ **Generic error handling** → Error object logged as `{}`

---

## ✅ Solutions (In Order)

### STEP 1: Populate Disease Codes (CRITICAL - Do First!)

**File:** `fix_missing_data.sql`

**What to do:**
1. Open Supabase Dashboard
2. Go to SQL Editor  
3. Copy entire `fix_missing_data.sql`
4. Click RUN

**Result:** 20 disease codes added (CHOL, COVID, MEAS, etc.)

---

### STEP 2: Create Storage Bucket

**Manual steps in Supabase:**

1. **Storage** → **New bucket**
2. Name: `case-attachments`
3. Keep **PRIVATE** (unchecked public)
4. Click **Create**

5. **Set Policies:**
   - Go to bucket → **Policies** tab
   - **New Policy** → Template: "Enable insert for authenticated"
   - **New Policy** → Template: "Enable read for authenticated"

---

### STEP 3: Improve Error Handling in Form

The current error handler (line 310-312) logs empty object. Let's fix it:

**Current code (BAD):**
```typescript
} catch (error) {
  console.error('Form submission error:', error);  // Shows {}
  toast.error('Failed to submit case report');     // Generic
}
```

**Better approach - Update line 310-316:**

```typescript
} catch (error: any) {
  console.error('Form submission error:', error);
  
  // Show specific error message
  const errorMessage = error?.message || 
                      error?.details || 
                      error?.hint ||
                      'Failed to submit case report';
  
  toast.error(errorMessage, {
    description: error?.code ? `Error code: ${error.code}` : undefined
  });
}
```

---

## 🎯 Quick Verification

After fixes, test:

```bash
npm run dev
```

**Test flow:**
1. Go to `/dashboard/report`
2. Check disease dropdown → Should show 20 diseases ✅
3. Select "COVID-19"
4. Fill all fields
5. Upload photo → Should succeed ✅  
6. Submit → Should create case ✅
7. Check dashboard → Should show new case ✅

---

## 🐛 Detailed Error Analysis

### Error #1: Foreign Key Violation

```json
{
  "code": "23503",
  "details": "Key is not present in table \"disease_codes\".",
  "message": "violates foreign key constraint \"case_reports_disease_code_fkey\""
}
```

**Cause:** `disease_codes` table is empty  
**Fix:** Run `fix_missing_data.sql`  
**Why it happens:** Database was initialized without seed data

---

### Error #2: Storage Bucket Not Found

```
StorageApiError: Bucket not found
```

**Cause:** Bucket `case-attachments` doesn't exist  
**Fix:** Create it manually in Supabase Storage  
**Why it happens:** Buckets must be created through UI or API, not SQL

---

### Error #3: Empty Error Object `{}`

**Cause:** Error serialization in console.error  
**Fix:** Access specific error properties (`.message`, `.details`)  
**Why it happens:** PostgreSQL errors have nested structure

---

## 📝 Alternative: Use New Server Actions

Instead of direct Supabase calls, use our new server actions:

**Update CaseReportForm.tsx line 253-261:**

```typescript
// Import at top
import { createCaseReport } from '@/features/cases/actions'

// Replace inline insert with server action
const result = await createCaseReport({
  disease_code: data.disease_code,
  age_group: data.patient_age_group,
  gender: data.patient_gender,
  symptoms: data.symptoms.join(', '),
  location_detail: data.location_latitude && data.location_longitude
    ? `${data.location_latitude}, ${data.location_longitude}`
    : '',
  district_id: profile.district_id,
  facility_id: profile.facility_id,
  notes: data.notes || '',
  status: 'suspected',
})

if (result.error) {
  throw new Error(result.error)
}
```

**Benefits:**
- ✅ Better validation (Zod schema)
- ✅ Clearer error messages
- ✅ Automatic cache invalidation
- ✅ Server-side security

---

## 🚀 Full Fix Checklist

- [ ] Run `fix_missing_data.sql` in Supabase SQL Editor
- [ ] Run `database_optimization.sql` (for performance)
- [ ] Create `case-attachments` bucket in Supabase Storage
- [ ] Set bucket policies (insert + read for authenticated)
- [ ] Update error handling in CaseReportForm (optional but recommended)
- [ ] Test form submission
- [ ] Verify case appears in dashboard

---

## 🎓 Why These Errors Happened

**Root cause:** Database was set up but not seeded with initial data

**Normal flow should be:**
1. Create tables (schema) ✅ Done
2. Add indexes ⚠️ Needed (`database_optimization.sql`)
3. Seed reference data ❌ Missing (`fix_missing_data.sql`)
4. Create storage buckets ❌ Missing (manual step)

**Going forward:** Consider adding seed data to your initialization SQL

---

## 📊 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Run SQL files | 5 min | Pending |
| Create storage bucket | 2 min | Pending |
| Test form | 5 min | Pending |
| **Total** | **12 min** | Ready! |

---

After these fixes, your form will work perfectly! 🎉
