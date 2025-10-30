# Schema vs Frontend Integration Validation

**Status:** ⚠️ **MISMATCHES FOUND**  
**Last Checked:** 2025-10-29

---

## ✅ Matching Tables

All tables referenced in frontend code exist in database:

| Table Name | Frontend | Database | Status |
|------------|----------|----------|--------|
| `profiles` | ✅ | ✅ | ✅ MATCH |
| `user_roles` | ✅ | ✅ | ✅ MATCH |
| `case_reports` | ✅ | ✅ | ✅ MATCH |
| `lab_results` | ✅ | ✅ | ✅ MATCH |
| `outbreaks` | ✅ | ✅ | ✅ MATCH |
| `notifications` | ✅ | ✅ | ✅ MATCH |
| `districts` | ✅ | ✅ | ✅ MATCH |
| `facilities` | ✅ | ✅ | ✅ MATCH |
| `disease_codes` | ✅ | ✅ | ✅ MATCH |
| `audit_logs` | ✅ | ✅ | ✅ MATCH |

---

## ❌ Column Name Mismatches

### Critical Issues

#### 1. `case_reports` table

**Problem:** Frontend uses `reported_date`, Database has `report_date`

**Location:**
- `src/lib/api.ts:47`
- `src/lib/types.ts:28`
- `src/hooks/useDiseaseCodes.ts:40`

**Database Schema:**
```sql
CREATE TABLE case_reports (
  ...
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- ✅ Correct
  ...
)
```

**Frontend Code:**
```typescript
// ❌ WRONG
.order('reported_date', { ascending: false })

// ✅ SHOULD BE
.order('report_date', { ascending: false })
```

**Files to Fix:**
```
src/lib/api.ts                  (line 47)
src/lib/types.ts                (line 28)
src/hooks/useDiseaseCodes.ts    (line 40)
```

---

## ✅ Enum Values Validation

### `app_role` enum

**Database:**
```sql
'reporter', 'lab_tech', 'district_officer', 'national_officer', 'admin'
```

**Frontend Usage:**
- Sidebar roles: ✅ Match
- ProtectedRoute: ✅ Match
- useAuth hook: ✅ Match

### `case_status` enum

**Database:**
```sql
'suspected', 'confirmed', 'ruled_out', 'pending_lab'
```

**Frontend Usage:**
- CaseReportForm: ✅ Match
- Status filters: ✅ Match

### `outbreak_status` enum

**Database:**
```sql
'active', 'monitoring', 'resolved'
```

**Frontend Usage:**
- Outbreak queries: ✅ Match
- Status display: ✅ Match

---

## ⚠️ Type Definition Issues

### `CaseReportInput` Type

**Current (WRONG):**
```typescript
export type CaseReportInput = Omit<
  Tables['case_reports']['Insert'], 
  'id' | 'reported_date'  // ❌ Wrong column name
>;
```

**Should Be:**
```typescript
export type CaseReportInput = Omit<
  Tables['case_reports']['Insert'], 
  'id' | 'report_date'  // ✅ Correct column name
>;
```

---

## ✅ Foreign Key Relationships

All foreign key relationships in frontend match database:

| Relationship | Frontend | Database | Status |
|--------------|----------|----------|--------|
| `profiles.id` → `auth.users(id)` | ✅ | ✅ | ✅ |
| `user_roles.user_id` → `auth.users(id)` | ✅ | ✅ | ✅ |
| `case_reports.reporter_id` → `auth.users(id)` | ✅ | ✅ | ✅ |
| `case_reports.facility_id` → `facilities(id)` | ✅ | ✅ | ✅ |
| `case_reports.district_id` → `districts(id)` | ✅ | ✅ | ✅ |
| `case_reports.disease_code` → `disease_codes(code)` | ✅ | ✅ | ✅ |
| `lab_results.case_report_id` → `case_reports(id)` | ✅ | ✅ | ✅ |
| `facilities.district_id` → `districts(id)` | ✅ | ✅ | ✅ |

---

## ✅ Query Patterns Validation

### Case Reports Queries

**Frontend:**
```typescript
.from('case_reports')
.select('*')
.eq('disease_code', disease)
```

**Schema Compatibility:** ✅ VALID

### Lab Results Queries

**Frontend:**
```typescript
.from('lab_results')
.select(`
  *,
  case_reports (*)
`)
```

**Schema Compatibility:** ✅ VALID

### User Roles Queries

**Frontend:**
```typescript
.from('user_roles')
.select('role')
.eq('user_id', userId)
.single()
```

**Schema Compatibility:** ✅ VALID

---

## 🔧 Required Fixes

### 1. Fix Column Name Mismatches

**File: `src/lib/api.ts`**
```diff
- .order('reported_date', { ascending: false });
+ .order('report_date', { ascending: false });
```

**File: `src/lib/types.ts`**
```diff
- export type CaseReportInput = Omit<Tables['case_reports']['Insert'], 'id' | 'reported_date'>;
+ export type CaseReportInput = Omit<Tables['case_reports']['Insert'], 'id' | 'report_date'>;
```

**File: `src/hooks/useDiseaseCodes.ts`**
```diff
- .order('reported_date', { ascending: false });
+ .order('report_date', { ascending: false });
```

---

## ⚠️ Potential Future Issues

### 1. Missing Indexes

Frontend frequently queries by:
- `case_reports.disease_code`
- `case_reports.reporter_id`
- `case_reports.facility_id`
- `case_reports.district_id`
- `case_reports.status`

**Recommendation:** Add indexes (see DATABASE_SCHEMA.md)

### 2. RLS Policy Gaps

Current RLS policies may not support all frontend operations:
- ❌ No policy for updating case_reports
- ❌ No policy for deleting notifications
- ❌ No policy for outbreak CRUD

**Recommendation:** Add comprehensive RLS policies

### 3. Type Generation

**Current:** Types are manually defined in `src/lib/types.ts`  
**Recommended:** Auto-generate from Supabase

```bash
npx supabase gen types typescript --project-id ralsdfqtgnmstkvmacdp > src/integrations/supabase/types.ts
```

---

## ✅ Testing Checklist

After fixes, verify:

- [ ] Login works
- [ ] Profile page loads
- [ ] Case reports can be created
- [ ] Case reports list displays
- [ ] Lab results can be added
- [ ] Notifications appear
- [ ] Admin panel loads
- [ ] Role-based access works
- [ ] Disease codes dropdown populates
- [ ] Facilities dropdown populates
- [ ] Districts dropdown populates

---

## 📊 Summary

| Category | Status |
|----------|--------|
| Table Names | ✅ All Match |
| Column Names | ❌ **3 Mismatches** |
| Enum Values | ✅ All Match |
| Foreign Keys | ✅ All Match |
| Query Patterns | ✅ All Valid |
| **Overall** | ⚠️ **NEEDS FIXES** |

**Action Required:** Fix 3 column name mismatches (`reported_date` → `report_date`)

---

**Next Steps:**
1. Apply fixes to 3 files
2. Run type generation
3. Test all CRUD operations
4. Add recommended indexes
5. Update RLS policies

**Priority:** 🔴 HIGH - App may crash on case report queries
