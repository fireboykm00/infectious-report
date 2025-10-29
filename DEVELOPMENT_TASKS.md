# IDSR Development Tasks - Real-World Problem Solving

## 🎯 Mission: Build features that solve ACTUAL field problems

---

## Phase 1: DATA COLLECTION (Solves: Fragmented, delayed reporting)

### ✅ Completed:
- Basic authentication & RBAC
- Sidebar with logout
- Protected routes

### 🔨 TO BUILD NOW:

#### 1.1 Mobile-Friendly Case Report Form
**Problem:** Health workers in rural areas lack tools to log cases instantly  
**Solution:** Mobile-first offline form

**Tasks:**
- [ ] Create `/src/components/forms/CaseReportForm.tsx`
- [ ] Implement offline storage with IndexedDB
- [ ] Add automatic sync when connection returns
- [ ] GPS location capture (optional, with user consent)
- [ ] Photo upload with compression
- [ ] Receipt number generation
- [ ] Form auto-save every 30 seconds

**Features:**
- Age group selector (0-1, 1-5, 5-15, 15-49, 50+)
- Gender selector
- Symptom checklist (fever, cough, rash, diarrhea, etc.)
- Disease dropdown with search
- Onset date picker
- Notes field

#### 1.2 ICD-11 Disease Codes & Case Definitions
**Problem:** Inconsistent case definitions across facilities  
**Solution:** Built-in dropdowns with standardized codes

**Tasks:**
- [ ] Create disease codes table in Supabase
- [ ] Seed with priority diseases (measles, cholera, malaria, COVID, etc.)
- [ ] Add symptom checkers that auto-flag priority cases
- [ ] Create `/src/lib/diseases.ts` with disease definitions
- [ ] Implement smart disease suggestion based on symptoms

#### 1.3 Lab Upload Portal
**Problem:** Missing lab results, duplicate entries  
**Solution:** CSV/PDF upload with deduplication

**Tasks:**
- [ ] Create `/src/app/dashboard/lab/upload/page.tsx`
- [ ] CSV parser with column mapping UI
- [ ] Excel (XLSX) parser
- [ ] Deduplication algorithm (match by patient ID, sample ID)
- [ ] Bulk result approval workflow
- [ ] Error handling & validation

---

## Phase 2: DATA REPORTING (Solves: Slow, error-prone hierarchical reporting)

### 🔨 TO BUILD NOW:

#### 2.1 Real-Time Dashboard with Auto-Escalation
**Problem:** Reports lost in transit, delayed by mail/calls  
**Solution:** Real-time dashboard with auto-alerts

**Tasks:**
- [ ] Create `/src/components/dashboard/RealTimeDashboard.tsx`
- [ ] Live case counter (using Supabase Realtime)
- [ ] Auto-escalation rules engine
- [ ] Alert when threshold exceeded (e.g., 5+ cholera cases in 24h)
- [ ] Notification to higher levels (district → national)
- [ ] Recent cases list with status

**Alert Rules:**
- 3+ cases of same disease in 24h → Flag
- 5+ cases in 24h → Auto-escalate to district
- 10+ cases in 48h → Auto-escalate to national

#### 2.2 Role-Based Data Visibility
**Problem:** No visibility for lower levels, data overload  
**Solution:** Each role sees appropriate scope

**Tasks:**
- [ ] Implement data filtering in queries (facility/district/national)
- [ ] Create `/src/hooks/useFilteredCases.ts`
- [ ] Dashboard cards show only user's scope
- [ ] "My Facility" vs "My District" vs "All" toggles

#### 2.3 Multi-Language Support
**Problem:** Language barriers in multinational use  
**Solution:** i18n with English, French, Swahili

**Tasks:**
- [ ] Install next-intl
- [ ] Create translation files
- [ ] Language selector in user profile
- [ ] Translate all UI strings
- [ ] RTL support for future (Arabic)

---

## Phase 3: DATA ANALYSIS (Solves: Manual Excel = slow outbreak detection)

### 🔨 TO BUILD NOW:

#### 3.1 Automated Threshold Alerts
**Problem:** Outbreaks missed until too late  
**Solution:** Auto-detection with configurable thresholds

**Tasks:**
- [ ] Create alert_rules table in Supabase
- [ ] Background job to check thresholds every hour
- [ ] Supabase Edge Function: `check-thresholds`
- [ ] Alert notification system
- [ ] Admin UI to configure thresholds
- [ ] Historical baseline calculation (moving average)

**Example Rules:**
```
IF measles_cases > 3 in last 7 days in district X
AND season = low_season
THEN create_alert("Potential measles outbreak")
```

#### 3.2 Interactive Maps & Visualizations
**Problem:** No trend visualization  
**Solution:** Maps, charts, heatmaps

**Tasks:**
- [ ] Geographic heatmap using Leaflet (already integrated)
- [ ] Disease distribution by region
- [ ] Time-series line charts (cases over time)
- [ ] Age/gender demographics charts
- [ ] Hover tooltips with details
- [ ] Filterable by date range, disease, region

**Charts to Build:**
- Case trend (line chart)
- Disease distribution (pie chart)
- Geographic heatmap (Leaflet)
- Age pyramid (bar chart)
- Weekly comparison (bar chart)

#### 3.3 Analytics Dashboard
**Problem:** Data silos  
**Solution:** Unified analytics view

**Tasks:**
- [ ] Create `/src/app/dashboard/analytics/page.tsx` (enhance existing)
- [ ] KPI cards: Total cases, Active outbreaks, Lab confirmations
- [ ] Weekly/monthly trend comparison
- [ ] Top 5 diseases list
- [ ] Export to PDF/Excel buttons
- [ ] Shareable public reports

---

## Phase 4: RESPONSE & ACTION (Solves: Slow, uncoordinated response)

### 🔨 TO BUILD NOW:

#### 4.1 Action Tracker with Task Assignment
**Problem:** No clear task assignment  
**Solution:** Digital task management

**Tasks:**
- [ ] Create outbreak_actions table
- [ ] Create `/src/components/outbreak/ActionTracker.tsx`
- [ ] Task creation form (title, assignee, due date, priority)
- [ ] Task status workflow (pending → in_progress → completed)
- [ ] Email notification to assignee
- [ ] Calendar view of tasks
- [ ] Task completion with notes

**Task Types:**
- Vaccination campaign
- Contact tracing
- Sample collection
- Investigation team deployment
- Public awareness campaign

#### 4.2 Contact Tracing Module
**Problem:** Contact tracing done on paper  
**Solution:** Digital line lists with GPS

**Tasks:**
- [ ] Create contacts table in Supabase
- [ ] Create `/src/app/dashboard/contacts/page.tsx`
- [ ] Contact entry form (name, phone, relationship, exposure date)
- [ ] GPS location capture for contact addresses
- [ ] Follow-up schedule
- [ ] Contact testing status
- [ ] Export contact list for field teams

**Features:**
- Link contacts to index case
- Daily follow-up checklist
- Symptom monitoring
- Test result tracking
- Map view of contacts

#### 4.3 Vaccine/Supply Logistics
**Problem:** Vaccine stockouts during campaigns  
**Solution:** Inventory tracking with alerts

**Tasks:**
- [ ] Create inventory table
- [ ] Create `/src/app/dashboard/inventory/page.tsx`
- [ ] Stock level tracking (vaccines, test kits, PPE)
- [ ] Low stock alerts
- [ ] Consumption forecasting
- [ ] Expiry date tracking
- [ ] Request/transfer workflow

---

## Phase 5: FEEDBACK & COMMUNICATION (Solves: One-way reporting)

### 🔨 TO BUILD NOW:

#### 5.1 Bulletin Board & Announcements
**Problem:** Rumors spread, no feedback  
**Solution:** Official communication channel

**Tasks:**
- [ ] Create bulletins table
- [ ] Create `/src/app/dashboard/bulletins/page.tsx`
- [ ] Post creation (title, content, target audience)
- [ ] Rich text editor
- [ ] Audience targeting (role, district, facility)
- [ ] Read receipts
- [ ] Priority/urgent flags

#### 5.2 SMS & Email Notifications
**Problem:** Field workers miss critical updates  
**Solution:** Multi-channel notifications

**Tasks:**
- [ ] Integrate Twilio or Africa's Talking for SMS
- [ ] Email templates with Resend
- [ ] Notification preferences per user
- [ ] Supabase Edge Function: `send-notifications`
- [ ] Delivery status tracking
- [ ] Bulk messaging for campaigns

#### 5.3 Public Dashboard (Anonymized)
**Problem:** Communities left out, trust issues  
**Solution:** Transparent public data

**Tasks:**
- [ ] Create `/src/app/public/page.tsx`
- [ ] Anonymized case counts by region
- [ ] Disease trends (no personal data)
- [ ] Prevention tips
- [ ] Risk level indicators (low/medium/high)
- [ ] Downloadable situation reports
- [ ] No authentication required

---

## 🚀 IMPLEMENTATION ORDER (Next 2 Weeks)

### Week 1: Core Data Collection & Reporting
**Day 1-2:**
- [ ] Build CaseReportForm with offline support
- [ ] Add disease codes and symptoms

**Day 3-4:**
- [ ] Build RealTimeDashboard
- [ ] Implement auto-escalation alerts

**Day 5:**
- [ ] Create filtered data hooks
- [ ] Test with multiple roles

### Week 2: Analysis & Response
**Day 6-7:**
- [ ] Build analytics dashboard with charts
- [ ] Implement geographic map

**Day 8-9:**
- [ ] Create ActionTracker component
- [ ] Build contact tracing module

**Day 10:**
- [ ] Add bulletin board
- [ ] Integrate notifications

---

## 📊 Success Metrics (How we know it works)

### Data Collection:
- ✅ Case reported in <2 minutes (vs 2 days paper)
- ✅ 95% of cases have GPS location
- ✅ Lab results matched in <1 hour (vs 10-20 hours manual)

### Data Reporting:
- ✅ Zero reports lost in transit
- ✅ Auto-escalation in <5 minutes
- ✅ District officers see data in real-time

### Data Analysis:
- ✅ Outbreak detected 1-2 weeks earlier
- ✅ Threshold alerts within 1 hour
- ✅ Interactive maps load in <2 seconds

### Response & Action:
- ✅ Tasks assigned and tracked digitally
- ✅ Contact tracing 90% complete in 48h
- ✅ Zero vaccine stockouts

### Feedback:
- ✅ Bulletins reach 100% of users
- ✅ SMS notifications in <1 minute
- ✅ Public dashboard updated daily

---

## 🔧 Technical Architecture for These Features

### Frontend:
- React Hook Form for case forms
- Recharts for analytics
- Leaflet for maps
- IndexedDB for offline storage
- PWA service worker for sync

### Backend:
- Supabase Edge Functions for:
  - Threshold checking
  - Notifications
  - Deduplication
- PostgreSQL for all data
- Supabase Realtime for live updates
- Supabase Storage for attachments

### External Integrations:
- Twilio/Africa's Talking (SMS)
- Resend (Email)
- OpenStreetMap (Maps)

---

## 🎯 Next Immediate Steps

I will now BUILD these features in this order:

1. **CaseReportForm** - Mobile-friendly, offline-capable
2. **Disease codes** - Seed data with priority diseases
3. **RealTimeDashboard** - Live updates, auto-escalation
4. **Analytics charts** - Visualizations
5. **ActionTracker** - Response coordination

Let's start building! 🚀
