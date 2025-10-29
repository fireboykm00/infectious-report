# Complete Feature List - What's Left to Build

## 🎯 Current Status: Phase 1 Complete (Core Reporting) - 35% Done

This document lists EVERYTHING needed for a fully complete IDSR system.

---

## ✅ COMPLETED (Do Not Build Again)

### Core Infrastructure
- [x] Next.js 15 setup with App Router
- [x] Supabase authentication
- [x] TypeScript configuration
- [x] Tailwind CSS + shadcn/ui
- [x] PWA foundation
- [x] Database schema (users, profiles, facilities, districts, case_reports, lab_results, audit_logs)
- [x] Row Level Security policies

### Security & RBAC
- [x] 5 user roles (Reporter, Lab Tech, District Officer, National Officer, Admin)
- [x] Permission matrix (9 resources × 6 actions)
- [x] RBAC utilities (`hasPermission`, `canAccessRoute`, etc.)
- [x] Audit logging system
- [x] Middleware route protection
- [x] Logout functionality
- [x] Sidebar with role-based filtering

### Data Collection
- [x] Mobile-friendly case report form
- [x] Offline capability with auto-save
- [x] GPS location capture
- [x] Photo upload
- [x] Receipt number generation
- [x] WHO disease code library (14 priority diseases)
- [x] Symptom-to-disease matching
- [x] Form validation with Zod

---

## 🔧 TO REFINE & TEST (Current Phase - This Week)

### Pages That Need Testing/Refinement
1. **Dashboard Home** (`/dashboard/page.tsx`)
   - Currently shows basic overview
   - Needs: Live case count, recent cases, quick stats
   
2. **Analytics Page** (`/dashboard/analytics/page.tsx`)
   - Page structure exists but empty
   - Needs: Charts, maps, KPI cards

3. **Lab Results Page** (`/dashboard/lab/page.tsx`)
   - Basic structure exists
   - Needs: Table view, upload button

4. **Profile Page** (`/dashboard/profile/page.tsx`)
   - Exists but minimal
   - Needs: Edit profile form, password change

5. **Admin Page** (`/dashboard/admin/page.tsx`)
   - Exists but empty
   - Needs: User management table

6. **Notifications Page** (`/dashboard/notifications/page.tsx`)
   - Exists but empty
   - Needs: Notification list

7. **Outbreaks Page** (`/dashboard/outbreaks/page.tsx`)
   - Exists but empty
   - Needs: Outbreak list, create outbreak

### UI/UX Issues to Fix
- [ ] Loading states on all forms
- [ ] Error boundaries for crash recovery
- [ ] Toast notification positioning
- [ ] Mobile responsiveness check on all pages
- [ ] Dark mode consistency
- [ ] Keyboard navigation (accessibility)
- [ ] Screen reader support (ARIA labels)

---

## 📋 PHASE 2: Real-Time Reporting & Dashboards (Week 2-3)

### 2.1 Dashboard Enhancements
**Priority: HIGH** | **Effort: 2-3 days**

- [ ] Real-time case counter (Supabase Realtime)
- [ ] Recent cases table with pagination
- [ ] Cases by status chart (pie chart)
- [ ] Cases by disease chart (bar chart)
- [ ] Weekly trend line chart
- [ ] Quick action cards (Report Case, View Analytics, etc.)
- [ ] Alert notifications widget
- [ ] Facility/District selector for officers

**Files to Create:**
- `/src/components/dashboard/CaseCounter.tsx`
- `/src/components/dashboard/RecentCasesTable.tsx`
- `/src/components/dashboard/QuickStats.tsx`
- `/src/components/dashboard/AlertsWidget.tsx`

### 2.2 Auto-Escalation & Alerts
**Priority: HIGH** | **Effort: 2-3 days**

- [ ] Alert rules table in database
- [ ] Supabase Edge Function: `check-thresholds` (runs hourly)
- [ ] Create alert when threshold exceeded
- [ ] Notification to higher levels
- [ ] Alert management UI (admin)
- [ ] Alert history view

**Files to Create:**
- `/supabase/functions/check-thresholds/index.ts`
- `/supabase/migrations/add_alert_rules.sql`
- `/src/app/dashboard/alerts/page.tsx`
- `/src/components/alerts/AlertCard.tsx`

### 2.3 Case Management
**Priority: MEDIUM** | **Effort: 2 days**

- [ ] Case list page with filters
- [ ] Case detail page
- [ ] Case status update workflow
- [ ] Case timeline (created → confirmed → closed)
- [ ] Link lab results to cases
- [ ] Bulk actions (approve, reject, export)

**Files to Create:**
- `/src/app/dashboard/cases/page.tsx`
- `/src/app/dashboard/cases/[id]/page.tsx`
- `/src/components/cases/CaseListTable.tsx`
- `/src/components/cases/CaseDetail.tsx`
- `/src/components/cases/StatusBadge.tsx`

---

## 📊 PHASE 3: Analytics & Visualization (Week 3-4)

### 3.1 Analytics Dashboard
**Priority: HIGH** | **Effort: 3-4 days**

- [ ] KPI cards (Total cases, Confirmed, Active outbreaks, Lab confirmations)
- [ ] Time-series chart (cases over time)
- [ ] Disease distribution pie chart
- [ ] Geographic heatmap (Leaflet)
- [ ] Age/gender demographics chart
- [ ] Outbreak risk indicators
- [ ] Date range filter
- [ ] Export to PDF
- [ ] Export to Excel

**Files to Create:**
- `/src/components/analytics/KPICard.tsx`
- `/src/components/analytics/TimeSeriesChart.tsx`
- `/src/components/analytics/DiseaseDistribution.tsx`
- `/src/components/analytics/DemographicsChart.tsx`
- `/src/lib/analytics.ts` (calculation functions)

**Packages Needed:**
- `recharts` (charts)
- `react-leaflet` (maps)
- `jspdf` (PDF export)
- `xlsx` (Excel export)

### 3.2 Outbreak Detection
**Priority: HIGH** | **Effort: 2 days**

- [ ] Threshold calculation algorithm
- [ ] Baseline calculation (moving average)
- [ ] Anomaly detection (Z-score)
- [ ] Outbreak creation workflow
- [ ] Cluster detection on map
- [ ] Early warning signals

**Files to Create:**
- `/src/lib/outbreak-detection.ts`
- `/src/components/analytics/OutbreakDetector.tsx`

---

## 🚨 PHASE 4: Lab Integration & Deduplication (Week 4-5)

### 4.1 Lab Upload Portal
**Priority: HIGH** | **Effort: 3-4 days**

- [ ] CSV/Excel file upload
- [ ] Column mapping UI
- [ ] Preview before import
- [ ] Bulk validation
- [ ] Error reporting
- [ ] Sample ID barcode scanner
- [ ] PDF result parser (OCR optional)

**Files to Create:**
- `/src/app/dashboard/lab/upload/page.tsx`
- `/src/components/lab/FileUploader.tsx`
- `/src/components/lab/ColumnMapper.tsx`
- `/src/components/lab/ImportPreview.tsx`
- `/src/lib/lab-parser.ts`

**Packages Needed:**
- `papaparse` (CSV parsing)
- `xlsx` (Excel parsing)
- `react-dropzone` (file upload)

### 4.2 Deduplication System
**Priority: MEDIUM** | **Effort: 2 days**

- [ ] Matching algorithm (patient ID, sample ID, name+DOB)
- [ ] Fuzzy matching (Levenshtein distance)
- [ ] Review queue for uncertain matches
- [ ] Auto-link with confidence score
- [ ] Manual link/unlink UI

**Files to Create:**
- `/src/lib/deduplication.ts`
- `/src/app/dashboard/lab/review/page.tsx`
- `/src/components/lab/MatchReview.tsx`

**Packages Needed:**
- `fuzzyset.js` or `fuse.js` (fuzzy matching)

### 4.3 Lab Results Management
**Priority: MEDIUM** | **Effort: 2 days**

- [ ] Lab results table
- [ ] Filter by test type, result, date
- [ ] Link result to case
- [ ] Attach PDF/image of result
- [ ] Lab result approval workflow
- [ ] Lab statistics dashboard

**Files to Create:**
- `/src/components/lab/ResultsTable.tsx`
- `/src/components/lab/ResultDetail.tsx`
- `/src/app/dashboard/lab/results/page.tsx`

---

## 📞 PHASE 5: Response & Action Coordination (Week 5-6)

### 5.1 Outbreak Management
**Priority: HIGH** | **Effort: 3 days**

- [ ] Outbreak creation form
- [ ] Outbreak detail page
- [ ] Link cases to outbreak
- [ ] Outbreak status workflow (investigating → responding → contained)
- [ ] Affected regions map
- [ ] Response plan editor
- [ ] Situation reports

**Files to Create:**
- `/src/app/dashboard/outbreaks/page.tsx`
- `/src/app/dashboard/outbreaks/[id]/page.tsx`
- `/src/components/outbreaks/OutbreakForm.tsx`
- `/src/components/outbreaks/OutbreakMap.tsx`
- `/src/components/outbreaks/ResponsePlan.tsx`

### 5.2 Action Tracker
**Priority: HIGH** | **Effort: 2-3 days**

- [ ] Task creation form
- [ ] Task assignment to users
- [ ] Task priority levels
- [ ] Due date & reminders
- [ ] Task status workflow (pending → in_progress → completed)
- [ ] Task calendar view
- [ ] Task comments/notes
- [ ] Email notification to assignee

**Files to Create:**
- `/src/app/dashboard/tasks/page.tsx`
- `/src/components/tasks/TaskCard.tsx`
- `/src/components/tasks/TaskForm.tsx`
- `/src/components/tasks/TaskCalendar.tsx`
- `/supabase/migrations/add_tasks.sql`

### 5.3 Contact Tracing
**Priority: HIGH** | **Effort: 3 days**

- [ ] Contact entry form
- [ ] Link to index case
- [ ] Contact follow-up schedule
- [ ] Daily symptom monitoring
- [ ] GPS location of contacts
- [ ] Contact testing status
- [ ] Exposure map visualization
- [ ] Contact list export for field teams

**Files to Create:**
- `/src/app/dashboard/contacts/page.tsx`
- `/src/app/dashboard/contacts/[id]/page.tsx`
- `/src/components/contacts/ContactForm.tsx`
- `/src/components/contacts/ContactMap.tsx`
- `/src/components/contacts/FollowUpSchedule.tsx`
- `/supabase/migrations/add_contacts.sql`

### 5.4 Vaccine/Supply Logistics
**Priority: MEDIUM** | **Effort: 2-3 days**

- [ ] Inventory table (vaccines, test kits, PPE, medicines)
- [ ] Stock level tracking
- [ ] Low stock alerts
- [ ] Consumption rate calculation
- [ ] Forecast demand
- [ ] Expiry date tracking
- [ ] Transfer requests between facilities
- [ ] Stockout prevention alerts

**Files to Create:**
- `/src/app/dashboard/inventory/page.tsx`
- `/src/components/inventory/StockCard.tsx`
- `/src/components/inventory/TransferForm.tsx`
- `/src/lib/inventory-forecast.ts`
- `/supabase/migrations/add_inventory.sql`

---

## 💬 PHASE 6: Communication & Feedback (Week 6-7)

### 6.1 Bulletin Board
**Priority: MEDIUM** | **Effort: 2 days**

- [ ] Create bulletin/announcement
- [ ] Rich text editor
- [ ] Target audience selection (role, district, facility)
- [ ] Priority flags (urgent, normal, info)
- [ ] Read receipts
- [ ] Bulletin archive
- [ ] Pin important bulletins

**Files to Create:**
- `/src/app/dashboard/bulletins/page.tsx`
- `/src/components/bulletins/BulletinCard.tsx`
- `/src/components/bulletins/BulletinEditor.tsx`
- `/supabase/migrations/add_bulletins.sql`

**Packages Needed:**
- `@tiptap/react` or `react-quill` (rich text editor)

### 6.2 Notification System
**Priority: HIGH** | **Effort: 3-4 days**

- [ ] In-app notifications
- [ ] Email notifications (Resend API)
- [ ] SMS notifications (Twilio/Africa's Talking)
- [ ] Push notifications (PWA)
- [ ] Notification preferences (per user)
- [ ] Notification templates
- [ ] Delivery status tracking
- [ ] Retry failed notifications

**Files to Create:**
- `/src/components/notifications/NotificationBell.tsx`
- `/src/components/notifications/NotificationList.tsx`
- `/src/app/api/notifications/send/route.ts`
- `/supabase/functions/send-notification/index.ts`
- `/src/lib/notification-service.ts`

**External Services:**
- Resend (email)
- Twilio or Africa's Talking (SMS)

### 6.3 Public Dashboard
**Priority: LOW** | **Effort: 2 days**

- [ ] Public page (no auth required)
- [ ] Anonymized case counts by region
- [ ] Disease trends charts
- [ ] Risk level indicators
- [ ] Prevention tips
- [ ] Downloadable situation reports
- [ ] Subscribe to updates

**Files to Create:**
- `/src/app/public/page.tsx`
- `/src/components/public/PublicMap.tsx`
- `/src/components/public/TrendChart.tsx`

---

## 👥 PHASE 7: User Management & Admin (Week 7-8)

### 7.1 User Management
**Priority: MEDIUM** | **Effort: 2-3 days**

- [ ] User list table
- [ ] Create user form
- [ ] Edit user details
- [ ] Assign roles
- [ ] Assign facility/district
- [ ] Activate/deactivate users
- [ ] Reset password (admin)
- [ ] User activity log
- [ ] Bulk user import (CSV)

**Files to Create:**
- `/src/app/dashboard/admin/users/page.tsx`
- `/src/components/admin/UserTable.tsx`
- `/src/components/admin/UserForm.tsx`
- `/src/components/admin/UserActivity.tsx`

### 7.2 Facility Management
**Priority: MEDIUM** | **Effort: 2 days**

- [ ] Facility list
- [ ] Create/edit facility
- [ ] Facility hierarchy (district → facility)
- [ ] Facility contact info
- [ ] Facility capacity info
- [ ] Facility status (active/inactive)

**Files to Create:**
- `/src/app/dashboard/admin/facilities/page.tsx`
- `/src/components/admin/FacilityForm.tsx`

### 7.3 System Configuration
**Priority: MEDIUM** | **Effort: 2 days**

- [ ] Alert threshold configuration
- [ ] Disease code management (add/edit)
- [ ] System settings (retention policies, etc.)
- [ ] Backup configuration
- [ ] Email/SMS templates
- [ ] Integration settings

**Files to Create:**
- `/src/app/dashboard/admin/settings/page.tsx`
- `/src/components/admin/ThresholdConfig.tsx`
- `/src/components/admin/DiseaseCodeManager.tsx`

---

## 🌍 PHASE 8: Multi-Language Support (Week 8)

### 8.1 Internationalization (i18n)
**Priority: MEDIUM** | **Effort: 3 days**

- [ ] Install next-intl
- [ ] English translations
- [ ] French translations
- [ ] Swahili translations
- [ ] Language selector in profile
- [ ] RTL support for future (Arabic)
- [ ] Date/time localization
- [ ] Number formatting

**Files to Create:**
- `/src/i18n/en.json`
- `/src/i18n/fr.json`
- `/src/i18n/sw.json`
- `/src/middleware.ts` (update for i18n)

**Packages Needed:**
- `next-intl`

---

## 📱 PHASE 9: Mobile App (Optional - Week 9-10)

### 9.1 React Native App
**Priority: LOW** | **Effort: 2 weeks**

- [ ] React Native setup
- [ ] Case reporting screen
- [ ] Camera integration
- [ ] GPS integration
- [ ] Offline storage (AsyncStorage)
- [ ] Push notifications
- [ ] Biometric auth
- [ ] QR code scanner

---

## 🔗 PHASE 10: Integrations (Optional - Week 10+)

### 10.1 FHIR/HL7 Integration
**Priority: LOW** | **Effort: 1 week**

- [ ] FHIR endpoints (Patient, Observation, DiagnosticReport)
- [ ] HL7 message parser
- [ ] Mapping to IDSR data model
- [ ] FHIR export

### 10.2 National EHR Sync
**Priority: LOW** | **Effort: depends on EHR system**

- [ ] OAuth integration
- [ ] Data mapping layer
- [ ] Scheduled sync jobs
- [ ] Conflict resolution

---

## 🎮 PHASE 11: Gamification (Optional - Week 11)

### 11.1 Gamification Features
**Priority: LOW** | **Effort: 1 week**

- [ ] Badges for reporting milestones
- [ ] Leaderboard (top reporters)
- [ ] Facility rankings
- [ ] Achievement system
- [ ] Monthly awards

---

## 🧪 PHASE 12: Testing & Quality (Ongoing)

### 12.1 Automated Testing
**Priority: MEDIUM** | **Effort: 2 weeks**

- [ ] Unit tests (Vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] API endpoint tests
- [ ] Load testing (k6)
- [ ] Security testing (OWASP ZAP)

### 12.2 Documentation
**Priority: MEDIUM** | **Effort: 1 week**

- [ ] API documentation (Swagger/OpenAPI)
- [ ] User manuals per role
- [ ] Video tutorials
- [ ] FAQ section
- [ ] Troubleshooting guide
- [ ] Deployment guide

---

## 📊 SUMMARY

### By Priority:
- **HIGH Priority:** 12 features (Weeks 2-6)
- **MEDIUM Priority:** 9 features (Weeks 7-8)
- **LOW Priority:** 4 features (Weeks 9-11)

### By Effort:
- **Quick Wins (<2 days):** 8 features
- **Medium (2-4 days):** 15 features
- **Large (5+ days):** 6 features

### Total Estimated Time:
- **Core Features (High Priority):** 8-10 weeks
- **Complete System:** 12-14 weeks

---

## 🎯 RECOMMENDED APPROACH

### Phase 1: Polish Current Features (THIS WEEK)
✅ **DO THIS FIRST** before building new features
- Test all existing pages
- Fix UI/UX issues
- Ensure mobile responsiveness
- Add loading states
- Improve error handling

### Phase 2: Build Critical Features (Weeks 2-6)
Focus on features that directly solve field problems:
1. Real-time dashboard
2. Threshold alerts
3. Lab upload portal
4. Contact tracing
5. Action tracker

### Phase 3: Complete System (Weeks 7-14)
Build remaining features based on user feedback from Phase 2 pilot.

---

*Last Updated: October 29, 2025*
