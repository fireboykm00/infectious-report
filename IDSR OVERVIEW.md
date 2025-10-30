# **Overview / Goals**

Build an Infectious Disease Surveillance & Response (IDSR) web app so facilities, labs, and community health workers can report cases, national/district officers can analyze trends and trigger responses, and the system gives back actionable feedback and notifications.

Core properties:

* Real-time reporting pipeline (case → confirmation → escalation → response)

* Role-based access (facility-level vs district vs national vs lab vs viewer)

* Audit and provenance (who reported what & when)

* Offline / low-bandwidth support for field workers

* Privacy and security for health data (PHI)

* Extensible: lab results, contact tracing, vaccination campaigns, geospatial alerts

---

# **High-level architecture**

1. **Frontend (SPA / SSR)**

   * Web app for health officers, dashboards, admin panel.

   
2. **Backend API**

   * REST or GraphQL API that implements authentication, authorization, reporting, analytics endpoints, notifications.

3. **Database**

   * Relational DB (Postgres) for transactions & analytics-friendly queries. Time-series or analytic store (ClickHouse / TimescaleDB) optional later.

4. **Message bus & jobs**

   * Kafka/RabbitMQ or simple Redis queues for asynchronous tasks: SMS/email, heavy analytics, geoprocessing.

5. **File / image store**

   * S3-compatible storage for laboratory attachments, photos.

6. **Monitoring / Logging**

   * Observability stack (Prometheus \+ Grafana), structured logs (ELK / Loki).

7. **Deployment**

   * Docker containers \+ Kubernetes / managed services. CI/CD pipeline for tests & deploys.

---

# **Two recommended stacks (pick one)**

**Option A — TypeScript (recommended if you want fast frontend \+ backend parity)**

* Frontend: Next.js \+ TypeScript \+ TailwindCSS (+ shadcn/ui if you use it)

* Backend: Node.js \+ TypeScript \+ Express or NestJS

* ORM: Prisma

* DB: PostgreSQL

* Queue: BullMQ (Redis)

* Auth: JWT \+ refresh tokens \+ OAuth2 for external integrations

* Notifications: Twilio (SMS), SendGrid/Resend (email), FCM (push)

---

# **Core data model (entities)**

Below are core tables/collections and key fields (Postgres flavor). Keep PII minimal.

**Users**

* id (uuid)

* name

* email

* phone

* role\_id (FK)

* facility\_id (nullable)

* last\_login

* is\_active

**Roles**

* id

* name (e.g., facility\_reporter, district\_officer, national\_officer, lab\_tech, viewer)

* permissions (jsonb or join table)

**Facilities**

* id

* name

* type (clinic, hospital, lab, community)

* district\_id

* lat, lon

* contact\_info

**CaseReports**

* id (uuid)

* report\_date (timestamp)

* reporter\_id (FK Users)

* facility\_id

* patient\_age\_group / patient\_gender (avoid direct identifiers unless needed)

* disease\_code (ICD/managed list)

* symptoms (text or coded)

* status (suspected, probable, confirmed, closed)

* severity (mild/moderate/severe)

* lab\_result\_id (nullable)

* outbreak\_id (nullable)

* location (geo point)

* attachments (array of file refs)

* notes

* created\_at, updated\_at

**LabResults**

* id

* case\_report\_id (FK)

* test\_type

* result (positive/negative/indeterminate)

* tested\_at

* lab\_technician\_id

* attachments

**Outbreaks**

* id

* disease\_code

* start\_date

* status (investigating/responding/contained)

* affected\_districts (array)

* case\_count

* actions (json)

**Contacts (for contact tracing)**

* id

* case\_report\_id

* contact\_type

* contact\_age\_group

* contact\_status (monitored, infected)

* last\_followup

**Notifications**

* id

* recipient\_user\_id

* channel (email/sms/push)

* payload

* sent\_at, status

**AuditLogs**

* id

* user\_id

* action

* target\_type

* target\_id

* metadata (json)

* timestamp

---

# **Example REST API endpoints (design)**

Use consistent versioning: `/api/v1/...`

**Auth**

* `POST /api/v1/auth/login` → {email, password} \-\> {accessToken, refreshToken}

* `POST /api/v1/auth/refresh` → {refreshToken}

**Users & Roles**

* `GET /api/v1/users` (admin)

* `GET /api/v1/users/:id`

* `PUT /api/v1/users/:id`

**Facilities**

* `GET /api/v1/facilities`

* `GET /api/v1/facilities/:id`

**Case reporting**

* `POST /api/v1/case-reports` — create report

* `GET /api/v1/case-reports` — filters: date\_from, date\_to, disease\_code, district\_id, status

* `GET /api/v1/case-reports/:id`

* `PATCH /api/v1/case-reports/:id` — update status, attach lab results

**Lab results**

* `POST /api/v1/labs/results` — attach to case\_report\_id

* `GET /api/v1/labs/results?case_id=...`

**Outbreaks & response**

* `POST /api/v1/outbreaks`

* `GET /api/v1/outbreaks`

* `POST /api/v1/outbreaks/:id/actions` — create action like mass vaccination

**Analytics**

* `GET /api/v1/analytics/case-counts?group_by=district&start=...&end=...` → timeseries

**Notifications**

* `POST /api/v1/notifications/trigger` — triggers an SMS/email to target role/facility

---

# **Example POST payload: case report**

{  
  "facility\_id": "c3f6...uuid",  
  "reporter\_id": "a1b2...uuid",  
  "disease\_code": "CHOL",  
  "symptoms": \["diarrhea", "vomiting"\],  
  "patient\_age\_group": "15-49",  
  "patient\_gender": "female",  
  "status": "suspected",  
  "location": {"type":"Point","coordinates":\[30.091, \-1.965\]},  
  "attachments": \["s3://bucket/attachment1.jpg"\],  
  "notes": "Cluster of 6 patients with acute watery diarrhea."  
}

---

# **Frontend — pages & components**

Main user flows:

1. **Login / SSO** (2FA optional)

2. **Facility dashboard** — quick “submit new case” widget, recent reports, alerts

3. **New report form** — mobile-first, fields above, photo upload, offline save

4. **Lab module** — lab technicians attach results to cases

5. **Analytics dashboard** — maps, heatmaps, charts (case counts, trends, top diseases)

6. **Outbreak management** — view outbreak, assign actions, log resources used

7. **Notifications & Feedback** — messages sent back to reporter

8. **Admin** — manage users, roles, facilities, disease codes

UI components:

* Reusable form fields & validators

* Geolocation picker (map modal)

* Attachments uploader with background upload & retry

* Data table with server-side pagination & filters

* Alert / timeline component for outbreak actions

UX notes:

* Minimal fields for initial report — let updates add lab confirmation.

* Show confirmation/receipt number after submit.



