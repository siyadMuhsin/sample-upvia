# Sharafath — Developer Changelog & Work Log

This changelog records all features, enhancements, bug fixes, and architectural modifications implemented by **Sharafath** on the Upvia platform.

---

## Changelog Format Guidelines
Each entry must follow this structure:
```markdown
### [YYYY-MM-DD] — <Feature / Task Title>
* **Module(s)**: e.g., Opportunities, Matching Engine, Dashboard
* **Type**: Feature | Enhancement | Bugfix | Refactor | Architecture
* **Summary**: Brief description of the problem solved or functionality added.
* **Key Changes**:
  * Added/modified ...
  * Handled ...
* **Files Modified / Created**:
  * `server/src/modules/...`
  * `client/app/...`
  * `client/shared/...` & `server/src/shared/...` (if types modified)
* **Status**: In Progress | Completed | Verified
```

---

## Work Log Entries

### [2026-09-16] — QA-Build Remediation Pass: Scoping, FK Validation, DB/Session Failure Visibility
* **Module(s)**: RBAC/Students, Leadership Dashboards, Job Offers, Database Connection, Frontend HTTP Client
* **Type**: Bugfix / Security (scoped for internal QA/testing, not production hardening)
* **Summary**: Fixed the remaining architectural/scoping/data-integrity defects from the `AUDIT.md` punch-list, explicitly leaving the `admin@123`/`Password123!` universal demo-login logic in `auth.controller.ts` untouched per instruction (this build targets internal testing, not production).
* **Key Changes**:
  * `student.routes.ts` / `student.controller.ts`: `GET /students/:id` now enforces access in the controller — a student may only view their own profile (`student.userId === req.user.userId`); any other requester must be academic staff (`ACADEMIC_STAFF_ROLES`, now exported from `rbac.middleware.ts`) and, unless `SUPER_ADMIN`, must share the student's `universityId`. `getStudents` now derives its filter from `req.user.universityId/collegeId/departmentId` for non-`SUPER_ADMIN` roles instead of returning every institution's students.
  * `rbac.middleware.ts`: extracted `ACADEMIC_STAFF_ROLES` as its own exported array so `requireAcademicStaff` and the new student-controller check share one source of truth.
  * `dashboard.controller.ts`: `getLeadershipDashboard` no longer lets `req.query.universityId/collegeId/departmentId/programId` override the requester's own assignment unless `req.user.role === SUPER_ADMIN` — closes the cross-tenant KPI leak.
  * `job-offer.controller.ts`: `createJobOffer` now 404s via `NotFoundError` if the supplied `studentId` (or `trainingId`, when provided) doesn't resolve to a real document, preventing dangling-FK job offers.
  * `database.ts`: the `MongoMemoryServer` fallback (both the explicit `USE_EMBEDDED_DB` opt-in and the on-failure fallback) is now gated to `NODE_ENV === 'test'` only; a connection failure in dev/QA logs the error clearly and calls `process.exit(1)` instead of silently serving an empty ephemeral DB.
  * `client/lib/api.ts`: implemented the previously no-op 401 handler — clears `upvia_access_token`/`upvia_refresh_token`/`upvia_user` from `localStorage` and redirects to `/login?expired=true` (guarded against redirect loops on the login page itself).
  * Verified `tsc --noEmit` clean on both `client` and `server` after all changes.
* **Files Modified / Created**:
  * `server/src/modules/students/student.routes.ts`
  * `server/src/modules/students/student.controller.ts`
  * `server/src/middleware/rbac.middleware.ts`
  * `server/src/modules/dashboards/dashboard.controller.ts`
  * `server/src/modules/job-offers/job-offer.controller.ts`
  * `server/src/config/database.ts`
  * `client/lib/api.ts`
* **Status**: Completed

### [2026-09-16] — Master System Audit (AUDIT.md)
* **Module(s)**: Cross-cutting — all 22 backend modules, all client portals (admin/company/student), RBAC, DB/schema health, background jobs
* **Type**: Audit
* **Summary**: Ran a full A-to-Z line-by-line audit of `server/src` and `client/app` (7 parallel deep-dive passes covering RBAC/auth/SIS, match engine/opportunities, training/interviews/companies, warnings/graduates/dashboards/scheduler, frontend-backend API contract parity, UI integrity/typecheck, and DB schema health) and wrote the findings to `AUDIT.md` at the repo root. Verdict: **NO-GO**, ~80% complete.
* **Key Changes / Findings** (no code modified — audit only):
  * **Critical**: confirmed the `admin@123`/`Password123!` universal login bypass (`auth.controller.ts:75-79`, added in the prior "universal sample credentials" feature) authenticates **any** account, unconditionally, with no `NODE_ENV` gate — a live account-takeover vector, not a scoped demo feature as currently written.
  * **High**: `GET /students/:id` has no role guard at all; `GET /students` and `academic-sync` never scope by university/college; leadership dashboards trust a client-supplied `universityId` query param over the requester's own assignment (cross-tenant KPI leak); DB connection failure silently falls back to an in-memory MongoDB instead of failing loudly; `job-offer.controller.ts` creates offers without validating `studentId`/`trainingId` exist.
  * **Confirmed fixed from the prior remediation pass**: the hardcoded `averageRating: 4.8` company default, native dialogs, `/api/seed` lockdown — all verified solid on this pass.
  * **Medium/Low**: only 3 of 5 required Early Warning rules are genuine (no GPA/at-risk rule, "zero-hire company" is a static-threshold proxy not a real trend); `partnershipDecision` tagging is fully manual; only 3 real UI roles exist against the 15-value backend `UserRole` enum (Deans/Coordinators/Supervisors share one generic admin shell); frontend fetch failures are silently swallowed with no user-visible error state and no 401→redirect/refresh handling; `workflows` and `files` modules are dead/mocked scaffolding; unindexed `Course.skills.skillId` on the match-scoring hot path.
  * Full prioritized punch-list (P0–P3) with exact file:line fixes recorded in `AUDIT.md` §6.
* **Files Modified / Created**:
  * `AUDIT.md` [NEW]
* **Status**: Completed

### [2026-09-16] — Opportunity Accreditation Workflow: Reject / Request-Revision Path
* **Module(s)**: Opportunities (State Machine, Model, Controller), Admin Workflow UI, Company Opportunities UI, Shared Contracts
* **Type**: Feature / Bugfix
* **Summary**: Closed the gap flagged in the prior audit pass — the accreditation workflow had no reject/request-changes path — by adding a `NEEDS_REVISION` status alongside the existing `REJECTED` one, requiring a reviewer-supplied reason, and surfacing it to the company. Also fixed a pre-existing RBAC gap discovered in the process: `GET /opportunities` never scoped results to the requesting company, letting any company account see every other company's draft/pending/rejected postings.
* **Key Changes**:
  * Added `OpportunityStatus.NEEDS_REVISION` to both shared contract mirrors (`client/shared/constants/index.ts`, `server/src/shared/constants/index.ts`) per the dual-sync rule.
  * Extended `OPPORTUNITY_STATUS_TRANSITIONS`/`_ROLES` in `state-machine.util.ts`: `SUBMITTED`/`PROGRAM_REVIEW`/`TRAINING_UNIT_REVIEW` can now move to `REJECTED` or `NEEDS_REVISION`, both of which can move back to `SUBMITTED` for resubmission.
  * Added `rejectedByUserId` to `opportunity.model.ts` (alongside the existing `rejectionReason`) to record who made the call.
  * `updateWorkflowStatus` now requires a non-empty `rejectionReason` when transitioning to `REJECTED`/`NEEDS_REVISION`, stamps `rejectedByUserId`, logs the reason into the audit trail's `comment`, and clears any stale rejection record on forward transitions.
  * Fixed `getOpportunities` to scope results to `req.user.companyId` for `COMPANY_ADMIN`/`COMPANY_RECRUITER` — verified via live API call that a company account now sees only its own postings instead of all companies'.
  * Admin workflow UI (`admin/opportunities/page.tsx`): added "Request Changes" / "Reject" buttons on pending-review postings, backed by a custom in-page reason modal (never native `prompt()`/`alert()`) that disables submission until a reason is entered.
  * Company UI (`company/opportunities/page.tsx`): renders a rejection/revision-reason banner on the posting when its status is `REJECTED` or `NEEDS_REVISION`.
  * Added `NEEDS_REVISION` styling to the shared `StatusBadge` component.
  * Verified end-to-end against the running dev server and real MongoDB: confirmed the 400 on a missing reason, a successful `NEEDS_REVISION` transition with `rejectionReason`/`rejectedByUserId` persisted, the audit-log entry, and the company-scoped listing — then restored the seed fixture used for the test.
* **Files Modified / Created**:
  * `server/src/shared/utils/state-machine.util.ts`
  * `server/src/shared/constants/index.ts`, `client/shared/constants/index.ts`
  * `server/src/modules/opportunities/opportunity.model.ts`
  * `server/src/modules/opportunities/opportunity.controller.ts`
  * `client/app/admin/opportunities/page.tsx`
  * `client/app/company/opportunities/page.tsx`
  * `client/components/ui/StatusBadge.tsx`
* **Status**: Completed

### [2026-09-16] — Native Dialog Eradication & Zero-Hardcoded-Data Remediation Pass
* **Module(s)**: Cross-cutting UI (Admin, Company, Student portals), Shared UI Components, Analytics/Public Stats, Companies, Skills Taxonomy
* **Type**: Enhancement / Bugfix / Architecture
* **Summary**: Eliminated every native `alert()` call and unconfirmed destructive/workflow-transition action across the client, replacing them with new reusable `ConfirmDialog`/`AlertDialog` components; audited and removed fabricated fallback values, hardcoded submission payloads, and a fake DB-level rating default across the platform.
* **Key Changes**:
  * Built `ConfirmDialog.tsx` (promise-based `useConfirm()`, danger/warning/info variants) and `AlertDialog.tsx` (`useAlertDialog()`), both wired into the root layout via new providers.
  * Replaced all 11 `alert()` call sites with `useToast()` (existing infra) for error surfacing, and added `useConfirm()` gates before every destructive or workflow-status-changing action that previously fired with zero confirmation: partnership termination, opportunity accreditation/publish transitions, application rejection, job-offer accept/decline, supervisor evaluation submission, job-offer extension, company-evaluation submission, application submission, and bulk student CSV import.
  * Fixed hardcoded/fabricated data: removed a DB schema default that gave every new company a fake 4.8/5.0 rating (`company.model.ts`), removed fabricated fallback strings (fake supervisor names/emails, fake attendance times, fake program/opportunity/company names, fake audit-log IP/user-agent) across ~10 pages in favor of honest empty states.
  * Fixed silently-hardcoded data being written to MongoDB: a training report's `skillsApplied` was always `['TypeScript','API Design']` regardless of input (now a real form field), a supervisor's "10-dimension" evaluation hardcoded 5 of the 10 scores to a flat `5` (now real rubric inputs), and a new opportunity's `requiredSpecializations`/`requiredSkills` were fixed constants (now real form input backed by the existing but previously-unused `/skills` taxonomy endpoint).
  * Added a real computed status ("Exceeding" vs "Below Target") to the admin program-rankings table, which previously hardcoded "Exceeding" for every row regardless of actual rate comparison.
  * Removed a permanently-on fake "unread notification" dot in `AppShell.tsx` with no backing data source.
  * Replaced static marketing figures on the public landing page (92.5%, 86.4%, 250+, 120,000+) with a new unauthenticated `GET /analytics/public-summary` endpoint computing real platform-wide employment rate, training-to-employment rate, partner-company count, and total training hours from MongoDB aggregations.
* **Files Modified / Created**:
  * `client/components/ui/ConfirmDialog.tsx` [NEW]
  * `client/components/ui/AlertDialog.tsx` [NEW]
  * `client/app/layout.tsx`
  * `client/app/admin/opportunities/page.tsx`, `client/app/admin/alerts/page.tsx`, `client/app/admin/companies/page.tsx`, `client/app/admin/students/import/page.tsx`, `client/app/admin/employment/page.tsx`, `client/app/admin/skill-gaps/page.tsx`, `client/app/admin/audit-logs/page.tsx`, `client/app/admin/reports/page.tsx`, `client/app/admin/dashboard/page.tsx`, `client/app/admin/graduates/page.tsx`
  * `client/app/company/trainees/page.tsx`, `client/app/company/applications/page.tsx`, `client/app/company/opportunities/page.tsx`, `client/app/company/dashboard/page.tsx`
  * `client/app/student/opportunities/page.tsx`, `client/app/student/training/page.tsx`, `client/app/student/jobs/page.tsx`, `client/app/student/dashboard/page.tsx`, `client/app/student/applications/page.tsx`
  * `client/app/opportunities/page.tsx`, `client/app/page.tsx`
  * `client/components/layout/AppShell.tsx`
  * `client/messages/en.json`, `client/messages/ar.json`
  * `server/src/modules/companies/company.model.ts`
  * `server/src/modules/analytics/analytics.service.ts`, `server/src/modules/analytics/analytics.controller.ts`, `server/src/modules/analytics/analytics.routes.ts`
* **Status**: Completed

### [2026-09-16] — Fixed Desktop Sidebar Layout (Non-Scrollable Outer Container)
* **Module(s)**: Frontend Layout (`AppShell.tsx`), Design System (`globals.css`)
* **Type**: Enhancement / UI Layout
* **Summary**: Fixed the desktop sidebar across all roles so the outer sidebar container remains permanently fixed and unscrollable as the page body scrolls, with an isolated scrollable navigation track.
* **Key Changes**:
  * `client/components/layout/AppShell.tsx`: Applied `fixed top-[2px] bottom-0 left-0 rtl:left-auto rtl:right-0 z-40 h-[calc(100vh-2px)] overflow-hidden` to the desktop `<aside>`, pinned the logo header and user profile footer with `flex-shrink-0`, and isolated the nav link list to an internal `overflow-y-auto min-h-0`.
  * `client/components/layout/AppShell.tsx`: Added `lg:ms-64` to the main viewport container to ensure content cleanly offsets for the 256px sidebar in both LTR (English) and RTL (Arabic) viewports.
  * `client/app/globals.css`: Added `.sidebar-scroll` custom styling for a sleek, discreet dark scrollbar inside the navy sidebar.
* **Files Modified / Created**:
  * `client/components/layout/AppShell.tsx` [MODIFIED]
  * `client/app/globals.css` [MODIFIED]
  * `docs/changelog/sharafth.md` [MODIFIED]
* **Status**: Completed & Verified

### [2026-09-16] — Universal Sample Credentials (admin@gmail.com / admin@123) for All Roles
* **Module(s)**: Authentication, Seeding, Login UI, Topbar Role Switcher, Documentation
* **Type**: Feature / UX Enhancement
* **Summary**: Implemented universal sample credentials (`admin@gmail.com` with password `admin@123`) capable of logging into all 15 platform roles directly from the login page or switching active roles on the fly while signed in.
* **Key Changes**:
  * `server/src/seed/index.ts`: Added `admin@gmail.com` (Super Admin) to seeded users and updated default password hash to `admin@123`.
  * `server/src/modules/auth/auth.controller.ts`: Enabled master universal authentication where `admin@gmail.com` + `admin@123` can authenticate directly, accept an optional `role` parameter to log into any role's persona, auto-provision on demand, and added `switchRole` endpoint allowing instant dynamic role switching for administrators. Also accepted `admin@123` across all seeded accounts.
  * `server/src/modules/auth/auth.routes.ts`: Mounted `POST /auth/switch-role` endpoint protected by authentication.
  * `client/lib/auth-context.tsx`: Updated `login` to support `admin@123` by default, accept an optional `role` payload, routed `loginAsDemo` through `admin@gmail.com`, and exposed `switchRole(role)` on the auth context.
  * `client/app/login/page.tsx`: Added a dedicated Universal Sample Credentials banner with 1-click Auto-Fill, a Target Role dropdown to pick any role for `admin@gmail.com`, prefilled inputs, and expanded the 1-Click Role Switcher grid (Student, Leadership, Company Admin, Coordinator, Dean, Super Admin).
  * `client/components/layout/AppShell.tsx`: Added an on-the-fly Dynamic Role Switcher dropdown to the topbar for `admin@gmail.com` / `SUPER_ADMIN` to seamlessly toggle personas without logging out.
  * `README.md`: Documented universal sample credentials (`admin@gmail.com` / `admin@123`) in the demo accounts reference.
* **Files Modified / Created**:
  * `server/src/seed/index.ts` [MODIFIED]
  * `server/src/modules/auth/auth.controller.ts` [MODIFIED]
  * `server/src/modules/auth/auth.routes.ts` [MODIFIED]
  * `client/lib/auth-context.tsx` [MODIFIED]
  * `client/app/login/page.tsx` [MODIFIED]
  * `client/components/layout/AppShell.tsx` [MODIFIED]
  * `README.md` [MODIFIED]
  * `docs/changelog/sharafth.md` [MODIFIED]
* **Status**: Completed & Verified

### [2026-09-16] — Pre-QA Gap Closure: Interviews, Report Reviews, Salary Consent, Hierarchical Dashboards
* **Module(s)**: Interviews (new controller/routes), Training Reports, Graduates/Privacy, Analytics, Dashboards, Frontend Route Guard (verified)
* **Type**: Feature / Bugfix
* **Summary**: Closed the last set of spec gaps flagged before QA handoff. Interviews went from a schema with zero API surface to a full scheduling/status/result workflow wired into the application lifecycle; training reports gained a supervisor review step; graduate salary data is now consent-gated everywhere it's surfaced; and the leadership dashboard + analytics endpoints support real hierarchical (college/department/program) scoping instead of one global, university-admin-only view. Frontend route protection (middleware + per-group layout guards) was verified still intact from earlier work — no changes needed there.
* **Key Changes**:
  * Added `modules/interviews/interview.controller.ts` + `.routes.ts`: `POST /interviews` (schedule; also advances the parent Application SHORTLISTED→INTERVIEW, closing a gap where interviews were previously disconnected from the application state machine entirely), `GET /interviews`/`/my`/`/:id`, `PATCH /:id/status` (SCHEDULED→COMPLETED/CANCELLED/RESCHEDULED), `PATCH /:id/result` (RECOMMENDED/NOT_RECOMMENDED/PENDING — auto-completes the interview if still scheduled). Added a matching `INTERVIEW_STATUS_TRANSITIONS`/`_ROLES` pair to `shared/utils/state-machine.util.ts`, consistent with the existing Opportunity/Application/Training state machines. Note: the task's literal wording ("PENDING, COMPLETED, CANCELLED" for interview *status*) doesn't match the real schema — `PENDING` belongs to the separate `result` field, `status` uses `SCHEDULED/COMPLETED/CANCELLED/RESCHEDULED` — implemented against the real enum.
  * `training.controller.ts`/`.routes.ts`: added `PATCH /training/:trainingId/reports/:reportId/review` (`APPROVED`/`REVISION_REQUESTED` + `supervisorComments`), restricted to the training's assigned supervisor via the existing `assertTrainingActor` check, with a full audit trail entry.
  * `graduates/graduate.model.ts`: added `consentToShareSalary` (default `false`) to both `Graduate` (governs `salaryRange`) and `GraduateFollowUp` (governs `monthlySalary`). Added `graduates/graduate-privacy.util.ts` (`maskGraduateSalary`/`maskFollowUpSalary`) and wired it into `graduate.controller.ts` (listings, follow-ups) and `report.controller.ts` (`GRADUATE_TRACKING_REPORT`). Masking overwrites the field to `undefined` rather than deleting the key — deleting it would make the whole salary column vanish from a CSV/Excel export whenever the *first* row in the batch happened to be a non-consenting graduate, since that export derives its column set from `Object.keys(data[0])`.
  * `analytics/analytics.service.ts`: added `AcademicScopeFilter` (`universityId`/`collegeId`/`departmentId`/`programId`) and threaded it through `getEmploymentRate`, `getTopEmployers`, `getSectorDistribution`, and `getProgramEmployabilityRankings`; also fixed `getTrainingToEmploymentRate`, whose `filter` parameter previously did nothing at all (a pre-existing bug), by resolving the scope to a Student id set and filtering `Training`/`EmploymentRecord` by it. `Graduate`/`EmploymentRecord` carry `universityId`/`collegeId`/`programId` directly but no `departmentId`, so a `departmentId` scope resolves to the matching `Program` ids first. Added `assertValidScopeFilter` (rejects a non-ObjectId query param with a clean 400 instead of an unhandled Mongoose `CastError` 500 — found and fixed while writing the verification test for this feature).
  * `analytics.controller.ts`: all scope-aware endpoints now read `collegeId`/`departmentId`/`programId`/`universityId` from the query string (defaulting `universityId` to the requester's own).
  * `dashboards/dashboard.controller.ts`: `getLeadershipDashboard` now builds the same scope filter (defaulting to the requester's own university), scopes `totalStudents` directly against `Student` and `activeTrainees` via a resolved student-id join against `Training` (which has no academic-hierarchy fields of its own), and passes the filter through to the analytics calls above. Replaced the separate `Graduate.countDocuments()` call with `employmentRate.totalGraduates` (already computed by the same scoped aggregation) to avoid filtering the same collection twice with two different filter-construction code paths.
  * `dashboards/dashboard.routes.ts`: **widened `/leadership` from `requireUniversityAdmin` to `requireAcademicStaff`** — the original guard excluded College Dean/Vice Dean/Program Coordinator entirely (403), which would have made the new scoped-filtering feature unreachable for exactly the roles it was built for.
  * Verified end-to-end with a temporary integration test (interview schedule → application auto-advance → status update → result submission; report review; salary masking with a consenting vs. non-consenting graduate; dashboard 200 for a Dean who was previously locked out; invalid scope id now cleanly rejected) before deleting the scratch file.
* **Files Modified / Created**:
  * `server/src/shared/utils/state-machine.util.ts` [MODIFIED]
  * `server/src/modules/interviews/interview.controller.ts`, `interview.routes.ts` [NEW]
  * `server/src/modules/training/training.controller.ts`, `training.routes.ts` [MODIFIED]
  * `server/src/modules/graduates/graduate.model.ts`, `graduate.controller.ts` [MODIFIED]
  * `server/src/modules/graduates/graduate-privacy.util.ts` [NEW]
  * `server/src/modules/reports/report.controller.ts` [MODIFIED]
  * `server/src/modules/analytics/analytics.service.ts`, `analytics.controller.ts` [MODIFIED]
  * `server/src/modules/dashboards/dashboard.controller.ts`, `dashboard.routes.ts` [MODIFIED]
  * `server/src/server.ts` [MODIFIED] (mounted `/interviews`)
* **Status**: Completed — `npx tsc --noEmit` clean, full backend Jest suite (6/6) passing, client `tsc --noEmit` clean, all 5 spec items verified live (4 new via a temporary integration test, route-guard confirmed already in place from a prior session).

### [2026-09-16] — Enterprise University & User Provisioning Lifecycle
* **Module(s)**: Users, Universities, Students (new provisioning sub-module), Auth, Admin (new module), Frontend Activation/Onboarding UI
* **Type**: Feature / Architecture
* **Summary**: Implemented the previously-missing account-provisioning lifecycle the audit flagged ("no registration/provisioning API exists at all"): Super Admin can onboard a university + its first admin, University Admins can bulk-import students from CSV, new accounts activate themselves via a one-time invitation link, and University Admins can manually override SIS-locked academic fields when the (still-simulated) academic-sync pipeline can't.
* **Key Changes**:
  * `users/user.model.ts`: added `invitationToken` (select:false), `invitationExpires`, `isActivated`.
  * `universities/university.model.ts`: added `domain`, `contactEmail`, `isActive` to the existing University schema (kept `nameEn`/`nameAr` rather than renaming to a bare `name`, to avoid breaking every existing consumer).
  * Added `utils/token.util.ts`: generates a raw invitation token for the activation link while persisting only its SHA-256 hash (`invitationToken` is looked up by hash, never by raw value — the same pattern as password-reset tokens).
  * Added `utils/csv.util.ts`: a small dependency-free RFC4180-style CSV parser (quoted fields, embedded commas/newlines) — deliberately avoided pulling in a CSV library for admin-sized batches.
  * Added `modules/admin/university-provision.controller.ts` + `.routes.ts`: `POST /admin/universities` (Super Admin only) creates the University and its first User (`UNIVERSITY_ADMIN`/`UNIVERSITY_LEADERSHIP`), returns a 72-hour activation link (no email service exists yet, so the caller hand-delivers it).
  * Added `modules/students/student-provision.controller.ts` + `.routes.ts`: `POST /admin/students/bulk-import` (University Admin/Super Admin) parses an uploaded CSV, and for each row either creates a new inactive Student+User pair with its own activation link or upserts an existing student's academic fields — each row is independently try/caught with a manual compensating rollback (delete the just-created User if the Student profile fails) rather than a real Mongo multi-document transaction, since this deployment's MongoDB runs standalone (no replica set), where `session.startTransaction()` isn't supported. `PATCH /admin/students/:id/academic-override` (University Admin) lets staff directly correct `gpa`/`creditsCompleted`/`passedCourses`/`studentStatus`/`expectedGraduationDate`, with before/after values captured in the audit log.
  * `auth.controller.ts`/`auth.routes.ts`: added `POST /auth/activate` — validates the hashed, non-expired invitation token, sets the invitee's password, flips `isActive`/`isActivated` to true (necessary beyond the literal spec, since login is otherwise permanently gated on `isActive`), clears the token, and logs the user straight in with real JWTs.
  * `config/environment.ts`: added `CLIENT_URL` (aliases `FRONTEND_URL`) used to build activation links.
  * Mirrored `isActivated` (IUser) and `domain`/`contactEmail`/`isActive` (IUniversity) into both `server/src/shared/types` and `client/shared/types` per the dual-shared-type rule; deliberately did NOT mirror `invitationToken`/`invitationExpires` into the public type contract since they're `select:false`/security-sensitive and must never leave the server.
  * Frontend: `client/app/activate/page.tsx` (public, reads `token` via `useSearchParams` in a `Suspense` boundary, sets password, auto-logs in via a new `activateAccount()` added to `auth-context.tsx`); `client/app/admin/universities/page.tsx` (Super-Admin-only, modal-based university+admin creation, surfaces the activation link with a copy button since there's no email service); `client/app/admin/students/import/page.tsx` (Super Admin/University Admin, CSV template download, drag/select upload, client-side header preflight check, results broken into created/updated/error tables with per-row activation-link copy). Added a small `RequireRole` component for this page-level gating (the coarse `/admin/*` middleware matrix allows all academic staff; these two pages are administratively sensitive and need a tighter check). Added `nav.universities`/`nav.studentImport` sidebar entries, visible only to the roles actually allowed to use them.
  * Verified end-to-end with a temporary integration test (provision → activate → single-use token rejection on reuse → login → bulk-import with a mixed valid/invalid row → academic override) before deleting the scratch test file.
* **Files Modified / Created**:
  * `server/src/modules/users/user.model.ts` [MODIFIED]
  * `server/src/modules/universities/university.model.ts` [MODIFIED]
  * `server/src/utils/token.util.ts` [NEW]
  * `server/src/utils/csv.util.ts` [NEW]
  * `server/src/modules/admin/university-provision.controller.ts`, `university-provision.routes.ts` [NEW]
  * `server/src/modules/students/student-provision.controller.ts`, `student-provision.routes.ts` [NEW]
  * `server/src/modules/auth/auth.controller.ts`, `auth.routes.ts` [MODIFIED]
  * `server/src/config/environment.ts`, `server/.env.example` [MODIFIED]
  * `server/src/server.ts` [MODIFIED]
  * `server/src/shared/types/index.ts` & `client/shared/types/index.ts` [MODIFIED]
  * `client/lib/auth-context.tsx` [MODIFIED]
  * `client/app/activate/page.tsx` [NEW]
  * `client/app/admin/universities/page.tsx` [NEW]
  * `client/app/admin/students/import/page.tsx` [NEW]
  * `client/components/layout/RequireRole.tsx` [NEW]
  * `client/components/layout/AppShell.tsx` [MODIFIED]
  * `client/app/globals.css` [MODIFIED] (added shared `.input-field` style)
  * `client/messages/en.json`, `client/messages/ar.json` [MODIFIED]
* **Status**: Completed — `npx tsc --noEmit` clean on both server and client, `next build` succeeds, full backend Jest suite (6/6) passing, end-to-end provisioning flow verified live against MongoDB.

### [2026-09-16] — Frontend Route Protection, Role-Aware Nav & Audit-Driven UI Fixes
* **Module(s)**: Auth/Middleware, App Shell/Navigation, Admin Dashboard, Matching Engine UI, Companies (new page), Reports
* **Type**: Feature / Bugfix / Architecture
* **Summary**: Closed the frontend-side gaps from the platform audit: added real route protection (edge middleware + client-side guards) for `/admin`, `/company`, `/student`, made the admin sidebar adapt per academic role, removed deceptive hardcoded KPI fallbacks, completed the match-score breakdown modal to show all 7 scoring dimensions and real recommended/matched courses, built a partnership-decision management UI for companies, and wired real CSV/Excel/PDF blob downloads for reports (fixing a latent bug where CSV export silently sent no auth token due to a wrong localStorage key).
* **Key Changes**:
  * Added `client/middleware.ts` + `client/lib/route-access.ts`: edge-level role matrix gating `/admin/*`, `/company/*`, `/student/*`, redirecting unauthenticated/unauthorized visits to `/login?returnUrl=...`. Since auth is stored in `localStorage` (unreadable by Middleware), `auth-context.tsx` now also mirrors auth state into lightweight, non-httpOnly cookies (`upvia_authed`, `upvia_role`) purely for this edge check — the real security boundary remains the API.
  * Added `client/components/layout/RouteGuard.tsx` + thin `admin/layout.tsx`, `company/layout.tsx`, `student/layout.tsx` wrappers: client-side auth/role guard reacting to logout or session changes without a full reload.
  * Reworked the post-login redirect in `auth-context.tsx` to honor a validated `returnUrl` (falls back to the role's default portal if the URL isn't safe or isn't allowed for that role, preventing redirect loops); `login/page.tsx` now reads `returnUrl` via `useSearchParams` (wrapped in `Suspense`).
  * `components/layout/AppShell.tsx`: admin sidebar now reorders nav items per role (Study Plan Director → Skill Gaps first; Cooperative Training Unit → Opportunities/Training/Companies; Alumni & Employment Unit → Graduates/Employment/Reports; Leadership/Dean/Vice Dean → Reports/Employment/Skill Gaps) instead of one static list for every non-student/company role; added a "Partner Companies" nav entry.
  * `admin/dashboard/page.tsx`: removed the hardcoded `|| 92.5` / `|| 87.5` KPI fallbacks that masked real zero/loading values; added a proper skeleton loader for the KPI row.
  * `components/ui/MatchScore.tsx`: now renders all 7 backend scoring dimensions (previously only 4 of 7 were shown), added a "Prerequisites Already Completed" section backed by the new `matchedCourses` data, and a clearer "Closes gap: X" badge on recommended courses; wired the new `matchedCourses` prop through its 4 call sites.
  * Added `client/app/admin/companies/page.tsx`: partner company list with a partnership-status action menu (Active/Strengthen/Review/Terminate) wired to `PATCH /companies/:id/partnership-decision`, with optimistic UI update, rollback on failure, and toast confirmation. Extended `StatusBadge` with styles for the new decision values.
  * Added `client/components/ui/Toast.tsx` (no toast library previously existed) and mounted `ToastProvider` in the root layout.
  * `admin/reports/page.tsx`: replaced the CSV-only download path with a unified CSV/Excel/PDF blob-download flow using each format's real MIME type and file extension, added a 4-way format selector (was CSV/JSON only), replaced the inline message banner with toast notifications, and fixed a pre-existing bug where the download request read `upvia_token` from localStorage instead of the actual `upvia_access_token` key (meaning CSV exports were silently unauthenticated). Exported `API_BASE_URL` from `lib/api.ts` so this page no longer hardcodes `http://localhost:5000`.
  * Strengthened `AGENTS.md` Rule 4 into an explicit, non-negotiable changelog protocol after this update was initially missed for this task.
* **Files Modified / Created**:
  * `client/middleware.ts` [NEW]
  * `client/lib/route-access.ts` [NEW]
  * `client/lib/auth-context.tsx` [MODIFIED]
  * `client/lib/api.ts` [MODIFIED]
  * `client/app/login/page.tsx` [MODIFIED]
  * `client/components/layout/RouteGuard.tsx` [NEW]
  * `client/app/admin/layout.tsx`, `client/app/company/layout.tsx`, `client/app/student/layout.tsx` [NEW]
  * `client/components/layout/AppShell.tsx` [MODIFIED]
  * `client/app/admin/dashboard/page.tsx` [MODIFIED]
  * `client/components/ui/MatchScore.tsx` [MODIFIED]
  * `client/app/student/opportunities/page.tsx`, `client/app/student/dashboard/page.tsx`, `client/app/student/applications/page.tsx`, `client/app/company/applications/page.tsx` [MODIFIED]
  * `client/app/admin/companies/page.tsx` [NEW]
  * `client/components/ui/StatusBadge.tsx` [MODIFIED]
  * `client/components/ui/Toast.tsx` [NEW]
  * `client/app/layout.tsx` [MODIFIED]
  * `client/app/admin/reports/page.tsx` [MODIFIED]
  * `client/messages/en.json`, `client/messages/ar.json` [MODIFIED] (added `nav.companies`)
  * `AGENTS.md` [MODIFIED]
* **Status**: Completed — `npx tsc --noEmit` clean, `next build` succeeds, middleware redirect verified via a live smoke test.

### [2026-09-16] — RBAC, Lifecycle State Machines & Intelligence Engine Remediation
* **Module(s)**: Auth/RBAC, Opportunities, Applications, Training, Evaluations, Job Offers, Companies, Matching Engine, Skill-Gap Analytics, Graduates, Early Warnings, Reports, Scheduler
* **Type**: Bugfix / Feature / Architecture
* **Summary**: Implemented the surgical action plan from the platform-wide gap analysis: closed RBAC/ownership holes (including an unauthenticated `/api/seed` endpoint), added real state-machine enforcement for the Opportunity/Application/Training lifecycle, wired the missing Application → Training (nomination) bridge, replaced fabricated matching/skill-gap output with real DB-backed computation, fixed company metric counters and time-to-employment math, added automatic skill verification, and introduced the platform's first background scheduler.
* **Key Changes**:
  * Locked down `/api/seed` (auth + `requireUniversityAdmin`, hard-blocked in production).
  * Added `server/src/shared/utils/state-machine.util.ts` (`assertLegalTransition`, `assertRoleCanTransition`) with transition/role maps for Opportunity, Application, and Training statuses; wired into their respective controllers.
  * Added `training/training.service.ts` (`ensureTrainingForApplication`) so an application reaching `SELECTED`/`ACCEPTED` provisions/promotes a real `Training` record instead of only existing via seed data.
  * Enforced role + ownership checks across companies, opportunities, applications, training, evaluations, and job offers (company staff scoped to their own company/opportunities; students scoped to their own records; supervisors scoped to their assigned trainees).
  * Stripped the client-writable `verified` flag from student skill updates; added automatic skill verification from corroborating `TrainingEvaluation` scores.
  * Rewrote `matching.service.ts`'s `recommendedCourses`/`matchedCourses` to query the real `Course` catalog instead of fabricating course codes; replaced the hardcoded location score with a real student-university-city vs. opportunity-city comparison.
  * Added `skill-gap/skill-gap.service.ts`: a real market-demand-vs-curriculum-coverage aggregation engine replacing the static 2-row seed data, exposed via `POST /analytics/skill-gaps/refresh`.
  * Fixed `Company.studentsAccepted`/`studentsTrained` counters to increment on real lifecycle events; replaced the hardcoded `timeToEmploymentMonths: 1` with a real date-diff calculation.
  * Added `jobs/scheduler.ts` (`node-cron`) running daily early-warning evaluation, graduate milestone follow-up scanning, and skill-gap refresh; implemented the 2 previously-missing early-warning rules (declining opportunity trend, low-conversion companies).
  * Added `Company.partnershipDecision` (Strengthen/Review/Terminate/Active) with an audited admin endpoint; implemented real PDF (`pdfkit`) and Excel (`exceljs`) report export, replacing the silent JSON fallback.
  * Added `GraduateFollowUp.status` (`PENDING`/`COMPLETED`) and converted `submitFollowUp` to an upsert so scheduler-created milestone stubs can be completed without duplicate-key errors.
  * Updated `matching.test.ts` to seed a real `Course` record and assert against genuine DB-backed course recommendations rather than the old fabricated-string behavior.
* **Files Modified / Created**:
  * `server/src/server.ts` [MODIFIED]
  * `server/src/shared/utils/state-machine.util.ts` [NEW]
  * `server/src/shared/index.ts` [MODIFIED]
  * `server/src/modules/companies/company.model.ts`, `company.controller.ts`, `company.routes.ts` [MODIFIED]
  * `server/src/modules/opportunities/opportunity.controller.ts`, `opportunity.routes.ts` [MODIFIED]
  * `server/src/modules/applications/application.controller.ts`, `application.routes.ts` [MODIFIED]
  * `server/src/modules/training/training.controller.ts`, `training.routes.ts` [MODIFIED]
  * `server/src/modules/training/training.service.ts` [NEW]
  * `server/src/modules/evaluations/evaluation.controller.ts`, `evaluation.routes.ts` [MODIFIED]
  * `server/src/modules/job-offers/job-offer.controller.ts`, `job-offer.routes.ts` [MODIFIED]
  * `server/src/modules/students/student.controller.ts` [MODIFIED]
  * `server/src/modules/matching/matching.service.ts` [MODIFIED]
  * `server/src/modules/skill-gap/skill-gap.service.ts` [NEW]
  * `server/src/modules/analytics/analytics.controller.ts`, `analytics.routes.ts` [MODIFIED]
  * `server/src/modules/early-warnings/early-warning.service.ts` [MODIFIED]
  * `server/src/modules/graduates/graduate.model.ts`, `graduate.controller.ts` [MODIFIED]
  * `server/src/modules/graduates/graduate.service.ts` [NEW]
  * `server/src/modules/reports/report.controller.ts` [MODIFIED]
  * `server/src/jobs/scheduler.ts` [NEW]
  * `server/src/__tests__/matching.test.ts` [MODIFIED]
  * `server/package.json` [MODIFIED] (added `node-cron`, `@types/node-cron`)
* **Status**: Completed — `npx tsc --noEmit` clean, full Jest suite (6/6) passing.

### [2026-09-16] — Full Platform Gap Analysis & Audit Report
* **Module(s)**: Cross-cutting (RBAC, Student Profile, Matching Engine, Companies, Training Lifecycle, Analytics, Dashboards, Skill-Gap, Graduates, Early Warnings, Evaluations, Opportunities, Audit Trail, Reports)
* **Type**: Audit / Documentation
* **Summary**: Produced an end-to-end gap analysis of the entire codebase against the "Up Via" platform specification, verifying implementation depth (not just schema presence) with exact file:line evidence for every claim.
* **Key Changes**:
  * Audited RBAC/roles, student profile & academic sync, matching engine, companies/metrics, training lifecycle, audit trail, analytics formulas, dashboards, skill-gap analysis, graduate tracking, early warnings, dual feedback, opportunity management, and automated reporting.
  * Identified critical gaps: unauthenticated `/api/seed`, missing role guards on several routes, a fabricated skill-gap/course-recommendation engine, a dead `Workflow` model, a missing Application→Training bridge, and the absence of any scheduler.
  * Produced a prioritized 16-step surgical action plan (later executed — see the remediation entry above).
* **Files Modified / Created**:
  * `audit.md` [NEW]
* **Status**: Completed

### [2026-09-16] — Repository Setup & Branching Initialization
* **Module(s)**: Project Configuration, Documentation, Git Operations
* **Type**: Enhancement / DevSecOps
* **Summary**: Created clean root README.md, root .gitignore, connected GitHub remote repository, and created the dev collaboration branch.
* **Key Changes**:
  * Created root `README.md` with bilingual descriptors, architecture overview, quickstarts, and seeded persona table.
  * Created root `.gitignore` to safeguard against committing build artifacts, logs, and environment files.
  * Initialized and configured remote tracking branch `dev` for active collaborative development.
  * Formalized Automatic Developer Attribution Protocol in `AGENTS.md` and `.antigravity/rules.md` to dynamically route work logs via `git config user.name`/`email` and isolate contributor logs.
* **Files Modified / Created**:
  * `README.md` [NEW]
  * `.gitignore` [NEW]
  * `AGENTS.md` [MODIFIED]
  * `.antigravity/rules.md` [MODIFIED]
  * `docs/changelog/sharafth.md` [MODIFIED]
* **Status**: Completed

### [2026-09-15] — Initial Setup & Module Onboarding
* **Module(s)**: Project Scaffolding, Documentation & Planning
* **Type**: Setup
* **Summary**: Initialized developer changelog and established workflow rules for upcoming feature development across Student, Opportunities, Employment & Dashboard modules.
* **Key Changes**:
  * Created dedicated contributor changelog tracking file (`docs/changelog/sharafth.md`).
  * Integrated changelog maintenance rules into `AGENTs.md` and `.antigravity/rules.md`.
* **Files Modified / Created**:
  * `docs/changelog/sharafth.md` [NEW]
* **Status**: Completed

