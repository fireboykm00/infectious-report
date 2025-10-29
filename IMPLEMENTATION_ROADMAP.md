# IDSR Platform - Complete Implementation Roadmap

## Current Status ✅
- Next.js 15 + App Router setup complete
- Supabase authentication & database integrated  
- Basic RBAC with user roles (reporter, lab_tech, district_officer, national_officer, admin)
- Protected routes with role-based access
- Sidebar with RBAC filtering & logout
- shadcn/ui components configured
- Offline-capable PWA foundation

## Phase 1: Enhanced Security & RBAC (Priority: CRITICAL)

### 1.1 Database Schema Enhancement
**Create Supabase migrations for:**
```sql
-- Enhanced profiles with detailed role permissions
ALTER TABLE profiles ADD COLUMN facility_id UUID REFERENCES facilities(id);
ALTER TABLE profiles ADD COLUMN district_id UUID;
ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN last_active TIMESTAMPTZ;

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  actions TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Row Level Security (RLS)
- Enable RLS on all tables
- Create policies for each role
- Implement facility-based data isolation
- Add audit logging triggers

### 1.3 API Route Protection
**Create middleware:**
- `/src/middleware.ts` - Route protection
- `/src/lib/rbac.ts` - Permission checker utilities
- `/src/lib/audit.ts` - Audit logging helper

## Phase 2: Core Case Reporting System

### 2.1 Case Reports Schema
```sql
CREATE TABLE case_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(50) UNIQUE,
  reporter_id UUID REFERENCES auth.users(id),
  facility_id UUID REFERENCES facilities(id),
  disease_code VARCHAR(20) NOT NULL,
  patient_age_group VARCHAR(20),
  patient_gender VARCHAR(10),
  symptoms JSONB,
  status VARCHAR(20) DEFAULT 'suspected',
  severity VARCHAR(20),
  onset_date DATE,
  report_date TIMESTAMPTZ DEFAULT NOW(),
  location GEOGRAPHY(POINT, 4326),
  lab_result_id UUID,
  outbreak_id UUID,
  attachments JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Offline Sync System
**Implement:**
- IndexedDB for offline storage
- Background sync service worker
- Conflict resolution UI
- Sync status indicators

### 2.3 Case Form Enhancement
- Photo/file upload with compression
- GPS location capture
- Offline submission queue
- Form validation & auto-save
- Receipt/confirmation number generation

## Phase 3: Laboratory Integration

### 3.1 Lab Results Module
```sql
CREATE TABLE lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_report_id UUID REFERENCES case_reports(id),
  sample_id VARCHAR(50) UNIQUE,
  test_type VARCHAR(100),
  result VARCHAR(50),
  tested_at TIMESTAMPTZ,
  lab_technician_id UUID REFERENCES auth.users(id),
  attachments JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Lab Upload Portal
- CSV/Excel import with mapping
- PDF result parsing (OCR optional)
- Barcode/QR scanner integration
- Auto-match to case reports
- Deduplication algorithm

## Phase 4: Analytics & Visualization

### 4.1 Dashboard Components
**Create React components:**
- Real-time case counter with trends
- Disease distribution pie/bar charts
- Time-series line graphs
- Geographic heatmap (Leaflet integration)
- Alert threshold indicators

### 4.2 Analytics Queries
**Supabase Edge Functions:**
- `/api/analytics/case-counts` - Aggregate by time/location/disease
- `/api/analytics/trends` - Moving averages & anomaly detection
- `/api/analytics/demographics` - Age/gender breakdowns
- `/api/analytics/outbreak-risk` - Threshold calculations

### 4.3 Reporting
- PDF generation (react-pdf)
- Excel export (xlsx)
- Scheduled email reports
- Custom date range filters

## Phase 5: Outbreak Management & Response

### 5.1 Outbreak Detection
```sql
CREATE TABLE outbreaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease_code VARCHAR(20),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'investigating',
  affected_regions JSONB,
  case_count INTEGER DEFAULT 0,
  response_plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE outbreak_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outbreak_id UUID REFERENCES outbreaks(id),
  action_type VARCHAR(50),
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Contact Tracing
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_report_id UUID REFERENCES case_reports(id),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  relationship VARCHAR(50),
  exposure_date DATE,
  last_contact_date DATE,
  follow_up_status VARCHAR(20),
  tested BOOLEAN DEFAULT false,
  test_result VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Response Tools
- Action task tracker with assignments
- Resource allocation module
- Vaccination campaign management
- Public communication templates

## Phase 6: Notification System

### 6.1 Multi-Channel Notifications
**Integrate:**
- Email (Resend/SendGrid via Supabase Edge Functions)
- SMS (Twilio/Africa's Talking)
- Push notifications (PWA)
- In-app notifications

### 6.2 Alert Rules Engine
```sql
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease_code VARCHAR(20),
  threshold_type VARCHAR(50),
  threshold_value INTEGER,
  region_id UUID,
  notification_channels TEXT[],
  recipients JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Notification Delivery
- Queue-based delivery (Supabase Realtime + Edge Functions)
- Retry logic with exponential backoff
- Delivery status tracking
- User notification preferences

## Phase 7: Advanced Features

### 7.1 Geospatial Analysis
- Cluster detection algorithms
- Buffer zone alerts
- Travel history tracking
- Hotspot identification

### 7.2 Inventory Management
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES facilities(id),
  item_type VARCHAR(50),
  item_name VARCHAR(100),
  quantity INTEGER,
  unit VARCHAR(20),
  expiry_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Integration Capabilities
- FHIR/HL7 endpoints (optional)
- National EHR sync
- WHO IHR reporting format export
- Data warehouse export (for BI tools)

## Phase 8: Performance & Scalability

### 8.1 Optimization
- Database indexing strategy
- Query optimization
- Edge caching (Vercel/Cloudflare)
- Image optimization & CDN
- Code splitting & lazy loading

### 8.2 Monitoring
**Set up:**
- Vercel Analytics
- Sentry error tracking
- Supabase Logs & Metrics
- Custom performance dashboards

## Phase 9: Testing & Quality Assurance

### 9.1 Test Coverage
- Unit tests (Vitest)
- Integration tests (Playwright)
- E2E tests for critical flows
- Load testing (k6)
- Security scanning (OWASP ZAP)

### 9.2 User Acceptance Testing
- Pilot with 1-2 facilities
- Feedback collection system
- Bug tracking (GitHub Issues)
- Performance benchmarking

## Phase 10: Documentation & Training

### 10.1 Technical Documentation
- API documentation (Swagger/OpenAPI)
- Database schema diagrams
- Deployment guide
- Troubleshooting guide

### 10.2 User Documentation
- User manuals per role
- Video tutorials
- Quick reference guides
- FAQ section

### 10.3 Training Program
- Online training modules
- In-person workshops
- Train-the-trainer program
- Support ticketing system

## Implementation Timeline

```
Week 1-2:   Phase 1 (Security & RBAC)
Week 3-4:   Phase 2 (Case Reporting)
Week 5-6:   Phase 3 (Lab Integration)
Week 7-8:   Phase 4 (Analytics)
Week 9-10:  Phase 5 (Outbreak Management)
Week 11-12: Phase 6 (Notifications)
Week 13-14: Phase 7 (Advanced Features)
Week 15:    Phase 8 (Optimization)
Week 16:    Phase 9 (Testing)
Week 17-18: Phase 10 (Documentation & Training)
```

## Success Metrics

- **Performance:** Page load < 2s, API response < 500ms
- **Reliability:** 99.9% uptime, zero data loss
- **Security:** Pass security audit, zero critical vulnerabilities
- **Usability:** User satisfaction > 4/5, task completion rate > 90%
- **Adoption:** 80% of facilities using system within 3 months
- **Impact:** Reduce outbreak detection time by 50%

## Next Immediate Steps

1. Create Supabase migrations for enhanced schema
2. Implement RLS policies
3. Build API routes with RBAC middleware
4. Create case reporting form with offline support
5. Integrate analytics dashboard components
