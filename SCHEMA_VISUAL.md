# IDSR Database Schema - Visual Diagram

```mermaid
erDiagram
    AUTH_USERS ||--o| PROFILES : "has"
    AUTH_USERS ||--o| USER_ROLES : "has"
    AUTH_USERS ||--o{ CASE_REPORTS : "reports"
    AUTH_USERS ||--o{ LAB_RESULTS : "processes"
    AUTH_USERS ||--o{ OUTBREAKS : "declares"
    AUTH_USERS ||--o{ NOTIFICATIONS : "receives"
    AUTH_USERS ||--o{ AUDIT_LOGS : "performs"
    
    DISTRICTS ||--o{ FACILITIES : "contains"
    DISTRICTS ||--o{ CASE_REPORTS : "located_in"
    
    FACILITIES ||--o{ PROFILES : "employs"
    FACILITIES ||--o{ CASE_REPORTS : "reported_from"
    FACILITIES ||--o{ LAB_RESULTS : "tests_at"
    
    DISEASE_CODES ||--o{ CASE_REPORTS : "categorizes"
    DISEASE_CODES ||--o{ OUTBREAKS : "tracks"
    
    CASE_REPORTS ||--o{ LAB_RESULTS : "has"
    
    AUTH_USERS {
        uuid id PK
        string email
        timestamp created_at
    }
    
    PROFILES {
        uuid id PK,FK
        string full_name
        string phone
        uuid facility_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK,UNIQUE
        enum role
        timestamp created_at
        timestamp updated_at
    }
    
    DISTRICTS {
        uuid id PK
        string name UNIQUE
        string code UNIQUE
        string province
        integer population
        timestamp created_at
    }
    
    FACILITIES {
        uuid id PK
        string name
        uuid district_id FK
        string type
        numeric latitude
        numeric longitude
        string contact_phone
        string contact_email
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    DISEASE_CODES {
        uuid id PK
        string code UNIQUE
        string name
        string description
        array symptoms
        boolean is_notifiable
        integer alert_threshold
        integer threshold_days
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    CASE_REPORTS {
        uuid id PK
        date report_date
        uuid reporter_id FK
        uuid facility_id FK
        uuid district_id FK
        string disease_code FK
        string age_group
        string gender
        string symptoms
        enum status
        string location_detail
        string notes
        jsonb attachments
        string client_local_id
        string sync_status
        string sync_error
        timestamp created_at
        timestamp updated_at
    }
    
    LAB_RESULTS {
        uuid id PK
        uuid case_report_id FK
        string test_type
        string result
        timestamp tested_at
        uuid lab_technician_id FK
        uuid lab_facility_id FK
        string notes
        jsonb attachments
        timestamp created_at
        timestamp updated_at
    }
    
    OUTBREAKS {
        uuid id PK
        string disease_code FK
        string location
        array affected_districts
        integer case_count
        date start_date
        date end_date
        enum status
        jsonb response_actions
        uuid declared_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string title
        string message
        string type
        boolean read
        jsonb payload
        timestamp created_at
    }
    
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string target_type
        uuid target_id
        jsonb old_data
        jsonb new_data
        inet ip_address
        string user_agent
        timestamp timestamp
    }
```

---

## Quick Reference Tables

### Core Data Flow

```
┌─────────────┐
│  Auth User  │
└──────┬──────┘
       │
       ├──→ Profile (personal info)
       ├──→ User Role (permissions)
       │
       ├──→ Case Report ──→ Lab Result
       │         │
       │         └──→ Outbreak Detection
       │
       └──→ Notifications ←── System Alerts
```

### Reporting Flow

```
Health Worker (reporter)
    │
    ├─→ Selects Disease (disease_codes)
    ├─→ Selects Facility (facilities)
    ├─→ Enters Patient Data
    │
    └─→ Creates Case Report
            │
            ├─→ Lab Tech assigns Lab Result
            │
            └─→ System checks for Outbreak
                    │
                    └─→ Sends Notifications
```

### Geographic Hierarchy

```
Country (Rwanda)
    │
    ├─→ Province (e.g., Kigali City)
    │       │
    │       └─→ District (e.g., Gasabo)
    │               │
    │               └─→ Facility (e.g., Hospital)
    │                       │
    │                       └─→ Case Reports
```

---

## Table Size Estimates

| Table | Expected Growth | Partition Strategy |
|-------|----------------|-------------------|
| `case_reports` | High (1000s/day) | Partition by report_date (monthly) |
| `lab_results` | Medium (100s/day) | Partition by tested_at (monthly) |
| `audit_logs` | Very High | Partition by timestamp (weekly) |
| `notifications` | High | Archive after 90 days |
| `outbreaks` | Low | No partitioning needed |
| `disease_codes` | Static | Reference data |
| `districts` | Static | Reference data |
| `facilities` | Low | No partitioning needed |

---

## Access Patterns

### By Role

#### **Reporter**
- ✅ Create case reports
- ✅ View own reports
- ✅ View disease codes
- ✅ View facilities in district
- ❌ Cannot modify lab results
- ❌ Cannot declare outbreaks

#### **Lab Tech**
- ✅ View assigned case reports
- ✅ Create/update lab results
- ✅ View disease codes
- ❌ Cannot create case reports
- ❌ Cannot declare outbreaks

#### **District Officer**
- ✅ View all cases in district
- ✅ View analytics for district
- ✅ View lab results
- ✅ Monitor outbreaks
- ❌ Cannot modify cases
- ⚠️ Can flag for investigation

#### **National Officer**
- ✅ View all national data
- ✅ Declare outbreaks
- ✅ View all analytics
- ✅ Export reports
- ✅ Send notifications

#### **Admin**
- ✅ Full access to all tables
- ✅ User management
- ✅ System configuration
- ✅ Audit log access

---

## Data Integrity Rules

### Cascading Deletes

```
DELETE auth.users
  ├─→ CASCADE profiles
  ├─→ CASCADE user_roles
  ├─→ SET NULL case_reports.reporter_id (should be NO ACTION)
  ├─→ SET NULL lab_results.lab_technician_id
  └─→ CASCADE notifications
```

### Required Fields

**Case Reports:**
- `report_date` ✓
- `reporter_id` ✓
- `disease_code` ✓

**Lab Results:**
- `case_report_id` ✓
- `test_type` ✓
- `result` ✓
- `tested_at` ✓

**Profiles:**
- `full_name` ✓

**User Roles:**
- `user_id` ✓
- `role` ✓

---

## Backup Strategy

### Critical Tables (Daily Backup)
- `case_reports`
- `lab_results`
- `outbreaks`
- `audit_logs`

### Reference Tables (Weekly Backup)
- `disease_codes`
- `districts`
- `facilities`
- `profiles`
- `user_roles`

### Point-in-Time Recovery
- Enabled for all tables
- 7-day retention minimum

---

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-10-26 | Initial schema |
| 1.1 | 2025-10-27 | Added user_roles for RBAC |
| 1.2 | 2025-10-29 | Added disease_codes |
| 2.0 | 2025-10-29 | Complete rewrite - idempotent schema |

---

**Schema Version:** 2.0  
**Last Updated:** 2025-10-29  
**Status:** ✅ Production Ready
