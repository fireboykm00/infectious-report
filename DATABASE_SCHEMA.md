# IDSR Platform Database Schema

**Last Updated:** 2025-10-29  
**Database:** PostgreSQL (Supabase)

---

## 📊 Table of Contents

1. [Enums](#enums)
2. [Tables](#tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Security (RLS)](#security)

---

## Enums

### `app_role`
User roles for role-based access control (RBAC).

```sql
'reporter'          -- Health facility reporters
'lab_tech'          -- Laboratory technicians
'district_officer'  -- District health officers
'national_officer'  -- National level officers
'admin'             -- System administrators
```

### `case_status`
Status of disease case reports.

```sql
'suspected'     -- Initial suspected case
'confirmed'     -- Laboratory confirmed
'ruled_out'     -- Ruled out/negative
'pending_lab'   -- Awaiting lab confirmation
```

### `outbreak_status`
Status of disease outbreaks.

```sql
'active'      -- Outbreak in progress
'monitoring'  -- Under monitoring
'resolved'    -- Outbreak resolved
```

---

## Tables

### 1. `profiles`
User profile information linked to Supabase Auth users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK → auth.users(id) | User ID (from auth) |
| `full_name` | TEXT | NOT NULL | User's full name |
| `phone` | TEXT | | Phone number |
| `facility_id` | UUID | FK → facilities(id) | Associated facility |
| `is_active` | BOOLEAN | DEFAULT true | Account active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- One-to-One with `auth.users`
- Many-to-One with `facilities`

---

### 2. `user_roles`
Role assignments for users (RBAC).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Role assignment ID |
| `user_id` | UUID | UNIQUE, FK → auth.users(id) | User ID |
| `role` | app_role | NOT NULL | Assigned role |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- One-to-One with `auth.users`

---

### 3. `districts`
Administrative districts/regions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | District ID |
| `name` | TEXT | NOT NULL, UNIQUE | District name |
| `code` | TEXT | UNIQUE | District code |
| `province` | TEXT | | Province name |
| `population` | INTEGER | | Population count |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Relationships:**
- One-to-Many with `facilities`
- One-to-Many with `case_reports`

---

### 4. `facilities`
Health facilities (hospitals, clinics, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Facility ID |
| `name` | TEXT | NOT NULL | Facility name |
| `district_id` | UUID | FK → districts(id) | District location |
| `type` | TEXT | | Facility type (hospital, clinic, etc.) |
| `latitude` | NUMERIC | | GPS latitude |
| `longitude` | NUMERIC | | GPS longitude |
| `contact_phone` | TEXT | | Contact phone number |
| `contact_email` | TEXT | | Contact email |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many-to-One with `districts`
- One-to-Many with `profiles`
- One-to-Many with `case_reports`
- One-to-Many with `lab_results`

---

### 5. `disease_codes`
WHO IDSR disease codes and definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Disease code ID |
| `code` | TEXT | UNIQUE, NOT NULL | Disease code (e.g., CHOL, MEAS) |
| `name` | TEXT | NOT NULL | Disease name |
| `description` | TEXT | | Disease description |
| `symptoms` | TEXT[] | | Array of symptoms |
| `is_notifiable` | BOOLEAN | DEFAULT true | Requires notification |
| `alert_threshold` | INTEGER | | Case count threshold for alert |
| `threshold_days` | INTEGER | DEFAULT 7 | Days for threshold calculation |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- One-to-Many with `case_reports`
- One-to-Many with `outbreaks`

---

### 6. `case_reports`
Disease case reports submitted by health workers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Case report ID |
| `report_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Date of report |
| `reporter_id` | UUID | NOT NULL, FK → auth.users(id) | Reporter user ID |
| `facility_id` | UUID | FK → facilities(id) | Reporting facility |
| `district_id` | UUID | FK → districts(id) | District location |
| `disease_code` | TEXT | FK → disease_codes(code) | Disease code |
| `age_group` | TEXT | | Patient age group |
| `gender` | TEXT | | Patient gender |
| `symptoms` | TEXT | | Symptoms description |
| `status` | case_status | DEFAULT 'suspected' | Case status |
| `location_detail` | TEXT | | Detailed location info |
| `notes` | TEXT | | Additional notes |
| `attachments` | JSONB | | File attachments metadata |
| `client_local_id` | TEXT | | Offline sync ID |
| `sync_status` | TEXT | | Sync status (for PWA) |
| `sync_error` | TEXT | | Sync error message |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many-to-One with `auth.users` (reporter)
- Many-to-One with `facilities`
- Many-to-One with `districts`
- Many-to-One with `disease_codes`
- One-to-Many with `lab_results`

---

### 7. `lab_results`
Laboratory test results for case reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Lab result ID |
| `case_report_id` | UUID | FK → case_reports(id) | Associated case report |
| `test_type` | TEXT | NOT NULL | Type of test performed |
| `result` | TEXT | NOT NULL | Test result |
| `tested_at` | TIMESTAMPTZ | NOT NULL | Date/time of test |
| `lab_technician_id` | UUID | FK → auth.users(id) | Lab technician |
| `lab_facility_id` | UUID | FK → facilities(id) | Laboratory facility |
| `notes` | TEXT | | Additional notes |
| `attachments` | JSONB | | File attachments metadata |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many-to-One with `case_reports`
- Many-to-One with `auth.users` (technician)
- Many-to-One with `facilities`

---

### 8. `outbreaks`
Disease outbreak tracking and management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Outbreak ID |
| `disease_code` | TEXT | FK → disease_codes(code) | Disease code |
| `location` | TEXT | | Location description |
| `affected_districts` | UUID[] | DEFAULT [] | Array of affected district IDs |
| `case_count` | INTEGER | DEFAULT 0 | Total case count |
| `start_date` | DATE | | Outbreak start date |
| `end_date` | DATE | | Outbreak end date |
| `status` | outbreak_status | DEFAULT 'active' | Outbreak status |
| `response_actions` | JSONB | | Response actions taken |
| `declared_by` | UUID | FK → auth.users(id) | Officer who declared |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many-to-One with `disease_codes`
- Many-to-One with `auth.users` (declarer)

---

### 9. `notifications`
User notifications and alerts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Notification ID |
| `user_id` | UUID | FK → auth.users(id) | Target user |
| `title` | TEXT | | Notification title |
| `message` | TEXT | | Notification message |
| `type` | TEXT | DEFAULT 'info' | Notification type |
| `read` | BOOLEAN | DEFAULT false | Read status |
| `payload` | JSONB | | Additional data |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Relationships:**
- Many-to-One with `auth.users`

---

### 10. `audit_logs`
System audit trail for security and compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Audit log ID |
| `user_id` | UUID | FK → auth.users(id) | User who performed action |
| `action` | TEXT | NOT NULL | Action performed |
| `target_type` | TEXT | NOT NULL | Type of target entity |
| `target_id` | UUID | | ID of target entity |
| `old_data` | JSONB | | Data before change |
| `new_data` | JSONB | | Data after change |
| `ip_address` | INET | | IP address |
| `user_agent` | TEXT | | User agent string |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | Action timestamp |

**Relationships:**
- Many-to-One with `auth.users`

---

## Relationships

### Entity Relationship Diagram (Text)

```
auth.users
  ├─→ profiles (1:1)
  ├─→ user_roles (1:1)
  ├─→ case_reports (1:N) as reporter
  ├─→ lab_results (1:N) as technician
  ├─→ outbreaks (1:N) as declarer
  ├─→ notifications (1:N)
  └─→ audit_logs (1:N)

districts
  ├─→ facilities (1:N)
  └─→ case_reports (1:N)

facilities
  ├─→ profiles (1:N)
  ├─→ case_reports (1:N)
  └─→ lab_results (1:N) as lab_facility

disease_codes
  ├─→ case_reports (1:N)
  └─→ outbreaks (1:N)

case_reports
  └─→ lab_results (1:N)
```

---

## Indexes

**Automatically created:**
- Primary keys on all tables
- Unique constraints on:
  - `districts.name`
  - `districts.code`
  - `disease_codes.code`
  - `user_roles.user_id`

**Recommended for performance** (to be added):
```sql
CREATE INDEX idx_case_reports_reporter ON case_reports(reporter_id);
CREATE INDEX idx_case_reports_facility ON case_reports(facility_id);
CREATE INDEX idx_case_reports_district ON case_reports(district_id);
CREATE INDEX idx_case_reports_disease ON case_reports(disease_code);
CREATE INDEX idx_case_reports_status ON case_reports(status);
CREATE INDEX idx_case_reports_date ON case_reports(report_date DESC);
CREATE INDEX idx_lab_results_case ON lab_results(case_report_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

---

## Security (Row Level Security)

### Enabled Tables
All tables have RLS enabled:
- `profiles`
- `user_roles`
- `case_reports`
- `lab_results`
- `outbreaks`
- `notifications`
- `disease_codes`

### RLS Policies

#### `profiles`
- **Select Own:** Users can view their own profile
- **Update Own:** Users can update their own profile

#### `user_roles`
- **Select Own:** Users can view their own role
- **Admin Access:** Admins can view all roles

#### `disease_codes`
- **Public Read:** All authenticated users can read

#### `case_reports`
- **Select Auth:** All authenticated users can view
- **Insert Auth:** Authenticated users can create (must match reporter_id)

#### `lab_results`
- **Select Auth:** All authenticated users can view
- **Insert Auth:** Authenticated users can create

---

## Triggers

### `handle_updated_at()`
Automatically updates `updated_at` timestamp on UPDATE.

**Applied to:**
- `profiles`
- `user_roles`
- `case_reports`
- `lab_results`
- `outbreaks`
- `facilities`
- `disease_codes`

---

## Sample Data

### Districts
- Gasabo (Kigali City) - 530,907
- Kicukiro (Kigali City) - 318,787
- Nyarugenge (Kigali City) - 284,561

### Disease Codes
- **CHOL** - Cholera
- **MEAS** - Measles
- **COVID** - COVID-19
- **MALA** - Malaria
- **EBOLA** - Ebola Virus Disease

---

## Notes

### Frontend Integration Points

1. **Authentication:** Uses Supabase Auth (`auth.users`)
2. **User Roles:** Check `user_roles.role` for RBAC
3. **Case Reporting:** Insert into `case_reports`
4. **Lab Results:** Insert into `lab_results`
5. **Outbreak Monitoring:** Read from `outbreaks`
6. **Disease List:** Read from `disease_codes`

### TypeScript Types

All types are auto-generated in:
```
src/integrations/supabase/types.ts
```

Generated from Supabase database schema.

---

**End of Schema Documentation**
