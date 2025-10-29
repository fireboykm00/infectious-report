# Testing & Refinement Plan - Make Current Features Production-Ready

## 🎯 Goal: Polish existing features before building new ones

---

## Phase 1: Install Missing Dependencies (5 minutes)

```bash
# Core dependencies
npm install @supabase/ssr react-hook-form @hookform/resolvers zod date-fns

# Optional but recommended
npm install @tanstack/react-query recharts lucide-react
```

---

## Phase 2: Database Setup (10 minutes)

### Apply Migrations
```bash
# In Supabase Dashboard, run:
supabase/migrations/20251029_add_disease_codes.sql
```

### Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Create bucket: `case-attachments`
3. Make it private
4. Add policy for authenticated users

### Verify Tables Exist
- [x] users (Supabase Auth)
- [x] profiles
- [x] user_roles
- [x] facilities
- [x] districts
- [x] case_reports
- [x] lab_results
- [x] outbreaks (if not, needs creation)
- [x] notifications
- [x] audit_logs
- [ ] disease_codes (run migration)

---

## Phase 3: Test Existing Pages (1 hour)

### Test Matrix

| Page | URL | Test | Status | Issues |
|------|-----|------|--------|--------|
| **Auth** | `/auth` | Login/Signup | ? | |
| **Dashboard** | `/dashboard` | Stats, Cases list | ? | |
| **Report Case** | `/dashboard/report` | Submit form | ? | |
| **Lab Results** | `/dashboard/lab` | View results | ? | |
| **Analytics** | `/dashboard/analytics` | Charts, maps | ? | |
| **Outbreaks** | `/dashboard/outbreaks` | List outbreaks | ? | |
| **Notifications** | `/dashboard/notifications` | View notifications | ? | |
| **Profile** | `/dashboard/profile` | Edit profile | ? | |
| **Admin** | `/dashboard/admin` | User management | ? | |

### Testing Checklist per Page

#### For Each Page:
- [ ] Page loads without errors
- [ ] Loading states show correctly
- [ ] Error states handled gracefully
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Dark mode works correctly
- [ ] All buttons functional
- [ ] Forms validate properly
- [ ] Data displays correctly
- [ ] Navigation works
- [ ] Back button works

---

## Phase 4: Fix Known Issues (2-3 hours)

### Issue 1: Dashboard - Missing Data
**File:** `/src/pages/Dashboard.tsx`
**Problem:** Stats show "..." for some values
**Fix:** 
- Add facility count query
- Add district count query
- Handle loading states better
- Add empty states

### Issue 2: Analytics Page - Empty
**File:** `/src/app/dashboard/analytics/page.tsx`
**Problem:** Page is empty/minimal
**Fix:**
- Add KPI cards
- Add basic charts (even if simple)
- Add date range filter
- Add export button placeholder

### Issue 3: Lab Page - No Content
**File:** `/src/app/dashboard/lab/page.tsx`
**Problem:** Missing lab results table
**Fix:**
- Add lab results table
- Add upload button (even if non-functional)
- Show pending cases

### Issue 4: Profile Page - Minimal
**File:** `/src/app/dashboard/profile/page.tsx`
**Problem:** Basic profile display only
**Fix:**
- Add edit form
- Add password change
- Add notification preferences

### Issue 5: Missing Loading States
**All Pages**
**Problem:** No consistent loading indicators
**Fix:**
- Create LoadingSpinner component
- Add skeleton loaders
- Add page-level loading states

### Issue 6: Error Handling
**All Pages**
**Problem:** Errors not user-friendly
**Fix:**
- Create ErrorBoundary component
- Add toast notifications
- Add retry buttons

### Issue 7: Mobile Responsiveness
**All Pages**
**Problem:** Some components overflow on mobile
**Fix:**
- Test all pages at 375px width
- Fix sidebar on mobile
- Fix tables to be scrollable
- Fix forms to stack vertically

---

## Phase 5: UI/UX Improvements (2-3 hours)

### 5.1 Create Reusable Components

#### LoadingSpinner
```tsx
// /src/components/ui/loading-spinner.tsx
export function LoadingSpinner({ size = 'md' }) {
  return <Loader2 className="animate-spin" />
}
```

#### EmptyState
```tsx
// /src/components/ui/empty-state.tsx
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
```

#### ErrorState
```tsx
// /src/components/ui/error-state.tsx
export function ErrorState({ error, retry }) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p>{error.message}</p>
      <Button onClick={retry}>Try Again</Button>
    </div>
  )
}
```

#### StatCard
```tsx
// /src/components/dashboard/stat-card.tsx
export function StatCard({ label, value, change, icon, trend }) {
  return (
    <Card>
      <CardContent>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{change}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5.2 Improve Dashboard
- [ ] Add welcome message with user name
- [ ] Add quick actions card
- [ ] Add recent activity timeline
- [ ] Add alerts/warnings widget
- [ ] Add "View All" links to sections
- [ ] Add refresh button
- [ ] Add last updated timestamp

### 5.3 Improve Forms
- [ ] Add field descriptions/help text
- [ ] Add character counters
- [ ] Add autofocus on first field
- [ ] Add keyboard shortcuts (Cmd+Enter to submit)
- [ ] Add unsaved changes warning
- [ ] Add success animations

### 5.4 Improve Tables
- [ ] Add sorting
- [ ] Add search/filter
- [ ] Add column visibility toggle
- [ ] Add row selection
- [ ] Add bulk actions
- [ ] Add export button
- [ ] Add pagination info (1-10 of 100)

---

## Phase 6: Accessibility (1 hour)

### ARIA Labels
- [ ] Add aria-label to all icon buttons
- [ ] Add aria-describedby to form fields
- [ ] Add role="alert" to error messages
- [ ] Add aria-live for dynamic updates

### Keyboard Navigation
- [ ] Test Tab key navigation
- [ ] Add keyboard shortcuts
- [ ] Test Escape to close modals
- [ ] Test Enter to submit forms

### Screen Reader Support
- [ ] Test with screen reader
- [ ] Add descriptive link text (no "click here")
- [ ] Add alt text to all images
- [ ] Add labels to all form fields

### Color Contrast
- [ ] Test with WCAG checker
- [ ] Ensure 4.5:1 ratio for text
- [ ] Don't rely on color alone
- [ ] Add patterns to charts

---

## Phase 7: Performance Optimization (1 hour)

### Code Splitting
- [ ] Lazy load heavy components
- [ ] Lazy load charts library
- [ ] Lazy load map library

### Image Optimization
- [ ] Use Next.js Image component
- [ ] Compress images
- [ ] Use WebP format
- [ ] Add lazy loading

### Query Optimization
- [ ] Add proper indexes to database
- [ ] Use pagination everywhere
- [ ] Cache frequently accessed data
- [ ] Debounce search inputs

### Bundle Size
- [ ] Remove unused dependencies
- [ ] Tree-shake imports
- [ ] Check bundle analyzer

---

## Phase 8: Testing Scenarios (2 hours)

### User Flow Testing

#### Flow 1: Reporter Reports a Case
1. Login as reporter
2. Navigate to /dashboard/report
3. Fill out case form (offline)
4. Turn off internet
5. Submit form → should save locally
6. Turn on internet → should auto-sync
7. Verify case appears in dashboard
8. Verify receipt number generated

**Expected:** Case saved offline, synced online, receipt shown

#### Flow 2: Lab Tech Enters Result
1. Login as lab_tech
2. Navigate to /dashboard/lab
3. View pending cases
4. Enter lab result
5. Verify case status updated
6. Verify notification sent

**Expected:** Result saved, case updated, reporter notified

#### Flow 3: District Officer Views Analytics
1. Login as district_officer
2. Navigate to /dashboard/analytics
3. View charts and maps
4. Filter by date range
5. Export report
6. Verify only sees own district

**Expected:** Analytics load, filters work, data scoped correctly

#### Flow 4: Admin Manages Users
1. Login as admin
2. Navigate to /dashboard/admin
3. Create new user
4. Assign role and facility
5. Edit user
6. Deactivate user

**Expected:** User CRUD operations work, audit logged

### Edge Case Testing

#### Test 1: Slow Network
- Turn on Chrome DevTools throttling
- Test all pages load correctly
- Test forms submit properly
- Verify loading states show

#### Test 2: No Internet
- Turn off internet completely
- Test offline form submission
- Test draft saving
- Test sync after reconnection

#### Test 3: Large Dataset
- Create 1000+ test cases
- Test pagination works
- Test search performance
- Test export handles large data

#### Test 4: Invalid Data
- Submit form with invalid data
- Test validation messages
- Test error recovery
- Test data sanitization

#### Test 5: Concurrent Users
- Open 2 browser tabs
- Make changes in both
- Test conflict resolution
- Test Realtime updates

---

## Phase 9: Error Scenarios (1 hour)

### Test Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Network timeout | Show "Connection lost" toast, retry button |
| 500 server error | Show friendly error, retry option |
| 401 unauthorized | Redirect to login |
| 403 forbidden | Show "Access denied" message |
| 404 not found | Show custom 404 page |
| Form validation error | Show inline error messages |
| File upload too large | Show size limit error |
| Database constraint violation | Show user-friendly message |
| Browser crash | Restore from localStorage |

---

## Phase 10: Browser Testing (30 minutes)

### Test on Multiple Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Test on Multiple Devices

- [ ] iPhone SE (375px)
- [ ] iPhone 12/13 (390px)
- [ ] iPad (768px)
- [ ] Desktop (1920px)
- [ ] 4K display (3840px)

---

## Phase 11: Security Testing (1 hour)

### Security Checklist

- [ ] Test RLS policies (can't access other facility data)
- [ ] Test RBAC (can't access unauthorized pages)
- [ ] Test SQL injection (forms sanitized)
- [ ] Test XSS (HTML escaped)
- [ ] Test CSRF (tokens present)
- [ ] Test session timeout
- [ ] Test password requirements
- [ ] Test file upload restrictions
- [ ] Test API rate limiting
- [ ] Test audit logs working

---

## Phase 12: Final Checklist Before Moving Forward

### Code Quality
- [ ] No console.errors in production
- [ ] No TODO comments in critical code
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings addressed
- [ ] Code formatted consistently

### Documentation
- [ ] README updated
- [ ] API documented
- [ ] Components documented
- [ ] Environment variables documented

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500kb

### User Experience
- [ ] All pages load without errors
- [ ] All forms work correctly
- [ ] All buttons have actions
- [ ] All links work
- [ ] Feedback for all actions
- [ ] Loading states everywhere
- [ ] Error handling everywhere
- [ ] Empty states handled
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)

---

## Test Results Template

### Test Session: [Date]
**Tester:** [Name]  
**Browser:** [Browser/Version]  
**Device:** [Device/Screen Size]

#### Issues Found:
1. [Issue description]
   - **Severity:** Critical / High / Medium / Low
   - **Page:** [URL]
   - **Steps to reproduce:** [...]
   - **Expected:** [...]
   - **Actual:** [...]
   - **Screenshot:** [link]

#### Tests Passed: X/Y

---

## Priority Order for Fixes

### P0 (Critical - Block launch):
1. Case report form doesn't submit
2. Login doesn't work
3. Data security breach
4. Complete page crash

### P1 (High - Fix before pilot):
1. Missing loading states
2. No error handling
3. Mobile layout broken
4. RBAC not enforcing

### P2 (Medium - Fix during pilot):
1. UI polish
2. Performance optimization
3. Accessibility improvements
4. UX refinements

### P3 (Low - Fix after pilot):
1. Nice-to-have features
2. Advanced animations
3. Extra polish
4. Edge case handling

---

## Success Criteria

✅ **Ready for Pilot Testing When:**
1. All P0 and P1 issues fixed
2. Can complete full user flow without errors
3. Works on mobile and desktop
4. Data security verified
5. Performance acceptable (< 3s load)
6. No critical bugs in test scenarios
7. User feedback positive

---

*Next Step: Start with Phase 1 (Install Dependencies), then Phase 3 (Test All Pages)*
