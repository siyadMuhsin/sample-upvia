# Master System Audit & Verification Report (Up Via Platform)

**Scope:** `server/src` (22 modules) and `client/app` (admin/company/student/opportunities/auth surfaces).
**Method:** Line-by-line inspection of controllers, services, models, routes, and client call sites — 7 parallel deep-dive passes, cross-verified against actual DB queries and persistence calls, not file/function names or seed data.

---

## 1. Executive Summary

**Overall Implementation Score: ~80% complete**
**Final Production Verdict: [NO-GO]**

The platform's core domain logic — the match engine, opportunity/application/training/interview state machines, cooperative training lifecycle (attendance/tasks/reports), graduate milestone tracking, multi-format reporting, and the background scheduler — is genuinely implemented against real MongoDB collections, not stubbed or hardcoded. Frontend-to-backend contract parity is unusually clean: **zero broken/mismatched endpoints** were found across 48 client call sites, and the platform has zero native browser dialogs and zero fabricated UI data.

However, three classes of defect block a GO verdict:

1. **A live authentication bypass.** `auth.controller.ts` accepts a universal password (`admin@123` / `Password123!`) for **any account in the system**, unconditionally, with no `NODE_ENV` gate. This is not a scoped demo feature — it is a production-reachable full account-takeover vector.
2. **Multiple broken authorization-scoping boundaries.** A Dean/Coordinator can list every student in the database (`GET /students`), view any individual student's profile with no role check at all (`GET /students/:id`), and pull another institution's leadership KPIs by supplying a different `universityId` query param (`dashboard.controller.ts`) — the RBAC *role* gates are present, but the *tenant-scoping* gates are largely absent.
3. **Silent failure modes that mask production incidents**: a MongoDB connection failure falls back to an ephemeral in-memory database instead of crashing loudly, and every frontend data-fetch failure is swallowed with `console.error` only, with no user-visible error state and no 401-driven redirect to `/login`.

Beyond these, the platform only exposes 3 real UI roles (admin/company/student) against a 15-value backend `UserRole` enum — Deans, Coordinators, Supervisors, and Training/Alumni Units all share one generic admin shell, differentiated only by nav-item ordering, not by scoped views. 2 of the 5 required Early Warning rules are missing or only approximately implemented, and company partnership-decision tagging is entirely manual rather than threshold-driven.

**Resolved from the prior remediation pass (confirmed via this audit):** the hardcoded `averageRating: 4.8` company default is gone (now a real aggregate), `/api/seed` is correctly locked to non-production + admin role, native dialogs are fully replaced by `ConfirmDialog`, and both `client`/`server` are `tsc --noEmit` clean.

---

## 2. Specification Feature Matrix

| # | Module / Spec Item | Status | Backend Controller/Service | Frontend Route/Component | Verified Findings & Gaps |
|---|---|---|---|---|---|
| 1 | RBAC & Role Enforcement (9 roles) | **Partial** | `middleware/rbac.middleware.ts:5-53`, `auth.middleware.ts:13-27` | `client/components/layout/AppShell.tsx` | Role-guard factory covers all roles correctly at most routes. **Defects:** `students/student.routes.ts:11` (`GET /:id`) has no role guard at all; `student.controller.ts:72-109` (`getStudents`) and `academic-sync.service.ts:51-67` never scope by university/college/department — any academic staffer can enumerate/sync all institutions' data. |
| 2 | Auth & Session Security | **Critical Defect** | `auth.controller.ts:36-52,75-79` | `client/lib/auth-context.tsx` | JWT/bcrypt/refresh-rotation/activation flow is otherwise solid (`jwt.util.ts:16-36`, `password.util.ts:1-11`, `auth.controller.ts:137-174`), **but** login accepts hardcoded passwords `admin@123`/`Password123!` for any account (line 75-79) with no environment gate, and a hardcoded `admin@gmail.com` + role param logs in as any demo role (36-52). |
| 3 | Unified Student Profile, SIS overrides & CSV Ingestion | **Implemented** | `student-provision.controller.ts:55-223`, `utils/csv.util.ts:8-78` | `client/app/admin/students/import/page.tsx` | Real RFC4180 parser, row validation, rollback-on-failure, audit logging. "SIS override" protection is only implicit (student self-edit path never destructures academic fields, `student.controller.ts:25-70`) — no declared model-level lock/flag exists. |
| 4 | Skill Auto-Verification & Skill-Gap Engine | **Implemented** | `evaluation.controller.ts:34-50`, `skill-gap.service.ts:27-109` | `client/app/admin/skill-gaps/page.tsx` | Real business logic: skills flip `verified=true` only when evaluation score ≥3 and skill is opportunity-required. Skill-gap aggregation is genuine (market demand vs. program coverage), not static. |
| 5 | Match Engine | **Implemented** | `matching/matching.service.ts:53-188` | `client/app/student/opportunities/page.tsx` | Confirmed real weighted formula (`shared/constants/index.ts:215-223`: specialization 30%, skills 30%, academic eligibility 15%, GPA 10%, experience 5%, location 5%, other 5%), DB-driven GPA/skills/location scoring, real `Course.find()` recommendations. No hardcoded scores found anywhere. |
| 6 | Courses & Study-Plans | **Partial** | `course.controller.ts`, `study-plan.controller.ts` | `client/app/company/opportunities/page.tsx` (skills only) | Both modules are read/create-only (no PUT/DELETE) — not full CRUD. `StudyPlan` is modeled correctly but never queried by the match engine (only `Course` is used). |
| 7 | Company Database, Conversion Rate & Partnership Tagging | **Partial** | `job-offer.controller.ts:128-133`, `evaluation.controller.ts:180-183`, `company.controller.ts:108-144` | `client/app/admin/companies/page.tsx` | Conversion rate and `averageRating` are genuine DB aggregations (old hardcoded 4.8 bug **confirmed fixed**). `partnershipDecision` (ACTIVE/STRENGTHEN/REVIEW/TERMINATE) is **100% manually set** — no code path derives it from `trainingToEmploymentRate`/`averageRating` thresholds; only informational alerts exist. |
| 8 | Opportunity Lifecycle & State Machine | **Implemented** | `opportunity.controller.ts`, `state-machine.util.ts:44-67` | `client/app/admin/opportunities/page.tsx` | 10-state enum, transition map correctly blocks illegal reverse transitions (e.g. CLOSED cannot reopen), role-gated, rejection requires a reason. |
| 9 | Applications → Nomination → Cooperative Training Lifecycle | **Implemented** | `application.controller.ts:172-202`, `training.controller.ts`, `training.model.ts:70-191` | `client/app/student/training/page.tsx`, `client/app/company/trainees/page.tsx` | Full real chain: Application(SELECTED)→Training(NOMINATED)→Application(ACCEPTED)→Training(COMPANY_ADMISSION)→…→COMPLETED. Attendance (date-based, unique-indexed), Tasks, and Reports (submit + supervisor review) are all genuine Mongoose-backed CRUD with FK integrity, not stubs. |
| 10 | Job Offers & Training Completion Handoff | **Partial / Defect** | `job-offer.controller.ts:12-56,15-30` | `client/app/student/jobs/page.tsx` | Offer creation is real and persisted, but **no existence validation** of client-supplied `studentId`/`trainingId` before `JobOffer.create` (dangling-FK risk), and no automatic offer trigger or COMPLETED-status check tied to training completion — entirely staff-initiated. |
| 11 | Interview Workflows & Evaluation Submissions | **Implemented** (with one architecture gap) | `interview.controller.ts`, `evaluation.controller.ts` | `client/app/company/trainees/page.tsx` | Scheduling, rescheduling, and result submission are real and state-machine-gated. 10-dimension supervisor + 7-dimension company evaluations are real, aggregate correctly, and feed skill-verification and company rating. **Gap:** no FK between `Evaluation` and `Interview` documents, and evaluation scores never gate job-offer eligibility or `training.finalGrade`. |
| 12 | Automated Early Warnings (5 rules required) | **Partial — 3 of 5** | `early-warning.service.ts:13-230` | `client/app/admin/alerts/page.tsx` | Genuine: missing-training-placement, low-attendance, opportunity-posting-drop-trend (real 30/60-day time-series comparison). **Missing:** no low-GPA/at-risk-student rule at all. **Substituted, not equivalent:** "zero-hire company" is only a static `trainingToEmploymentRate ≤5%` check, not a real period-over-period zero-hire trend. `AlertRule` DB config (thresholds/isActive) is imported but never read — all thresholds are hardcoded constants. |
| 13 | Graduate Tracking Automation & Salary Consent Masking | **Implemented** | `graduate.service.ts:3-42`, `graduate-privacy.util.ts:15-23` | `client/app/admin/graduates/page.tsx` | Real 3/6/12/24-month offset math, daily cron creates `PENDING` follow-ups, consent boolean genuinely strips salary fields pre-serialization (JSON and report exports alike). No defects found. |
| 14 | Multi-Tier Leadership Dashboards & Hierarchical Scoping | **Defect** | `dashboard.controller.ts:27-45`, `analytics.service.ts:34-65` | `client/app/admin/dashboard/page.tsx` | Query-construction/scoping mechanics are real, but `scopeFilter.universityId = req.query.universityId || req.user?.universityId` lets the **client-supplied query param override the user's own assignment** with no ownership check — a Dean can request another institution's KPIs. |
| 15 | Multi-Format Reports & Background Scheduler | **Implemented** | `report.controller.ts:51-180`, `jobs/scheduler.ts` | `client/app/admin/reports/page.tsx` | Real `exceljs`/`pdfkit` usage (not aspirational deps), correct content-types for JSON/CSV/PDF/Excel, consent masking carried through exports. 3 real `node-cron` jobs (early-warning daily 00:00, graduate milestones daily 01:00, skill-gap refresh daily 02:00), confirmed actually started via `startScheduledJobs()` in `server.ts:145`. |

---

## 3. Client-to-Server Contract Parity (UI = Backend)

Backend is mounted under `API_PREFIX` (`/api/v1`, `server/src/config/environment.ts:11`) at `server/src/server.ts:75-98`. All 48 frontend `apiClient()` call sites (single central HTTP wrapper, `client/lib/api.ts:7-58` — no raw `fetch`/`axios` elsewhere) were cross-referenced against real backend routes.

**Result: zero MISMATCH/BROKEN endpoints found.** Representative sample below (full 48-endpoint sweep performed; all resolved MATCH):

| Client Call (file:line) | Method | Path | Server Route (file:line) | Payload/Response Alignment | Verdict |
|---|---|---|---|---|---|
| `client/lib/auth-context.tsx:142` | POST | `/auth/login` | `auth.routes.ts:7`→`auth.controller.ts:29` | `{email,password,role}` in, `{accessToken,refreshToken,user}` out — matches | MATCH |
| `client/app/admin/dashboard/page.tsx:32` | GET | `/dashboards/leadership` | `dashboard.routes.ts:11` | KPIs/topEmployers/topSkills/recentAlerts/programRankings verified field-for-field | MATCH |
| `client/app/admin/companies/page.tsx:78` | PATCH | `/companies/:id/partnership-decision` | `company.routes.ts:26` | `{decision}` enum-validated both sides | MATCH |
| `client/app/company/opportunities/page.tsx:60,75` | GET/POST | `/opportunities` | `opportunity.routes.ts:27,29` | Server derives `companyId` from JWT, ignoring client value — correct anti-spoofing | MATCH |
| `client/app/admin/opportunities/page.tsx:69,90` | PATCH | `/opportunities/:id/workflow` | `opportunity.controller.ts:131` | `{status,rejectionReason}` required-field validation matches rejection modal | MATCH |
| `client/app/student/opportunities/page.tsx:65` | POST | `/applications` | `application.controller.ts:19` | `{opportunityId,coverLetter}` matches | MATCH |
| `client/app/company/trainees/page.tsx:83` | POST | `/evaluations/supervisor` | `evaluation.controller.ts:53` | All 10 dimensions matched exactly | MATCH |
| `client/app/student/jobs/page.tsx:51` | PATCH | `/job-offers/:id/respond` | `job-offer.controller.ts:75` | `{status}` | MATCH |
| `client/app/admin/alerts/page.tsx:27,42,66` | GET/POST/PATCH | `/early-warnings*` | `early-warning.routes.ts:8,9,12` | All fields read exist server-side | MATCH |
| `client/app/student/profile/page.tsx:41,60` | GET/PUT | `/students/me` | `student.controller.ts:25` | Frontend only edits a subset of editable fields — not a defect, just unused server capability | MATCH |

**Endpoints with real backend routes but zero frontend consumer** (feature gaps, not contract defects): `/courses`, `/study-plans`, `/notifications/*`, `/interviews/*` (direct), `/files/*`, `/academic-sync/*`, `/academic/*` lookups, `/matching/:opportunityId`. Also: no `client/app/admin/students/page.tsx` exists — there is no "browse all students" admin UI, only the CSV-import subpage.

**Auth header injection:** Correctly centralized — `client/lib/api.ts:25-33` attaches `Authorization: Bearer <token>` from `localStorage` on every call.

**Defect — 401/403 handling is a no-op stub:**
```js
// client/lib/api.ts:45-48
if (response.status === 401 && typeof window !== 'undefined') {
  // Optionally redirect to login if token expired
}
```
The comment describes intended behavior that was never implemented. An expired/invalid token falls through to the generic error path and is swallowed per-page (see §4). The backend exposes `POST /auth/refresh-token` (`auth.routes.ts:10`) and the client stores a refresh token (`auth-context.tsx:114`), but **no refresh-retry logic exists anywhere** — sessions simply fail silently on expiry instead of transparently renewing or redirecting to `/login`.

---

## 4. UI State, Dialog & Data Integrity Scan

**Native dialogs:** Confirmed **zero** `window.alert`/`confirm`/`prompt` calls anywhere in `client/`. All 11 confirmation call sites use the custom `useConfirm()` hook (`client/components/ui/ConfirmDialog.tsx`), mounted app-wide via `client/app/layout.tsx:34-36`. Every located destructive action (terminate partnership, reject/revision opportunity, decline candidate/offer, bulk import) is gated by a confirmation dialog.

- **Dead code found:** `AlertDialog`/`useAlertDialog` (`client/components/ui/AlertDialog.tsx`) is defined and provider-mounted but never called anywhere else in the app — blocking success/error alerts have no call site; errors surface only via toast or are silently swallowed.

**Hardcoded/fabricated data:** None found. All numeric fallbacks are legitimate `|| 0`/`?? 0` zero-defaults on optional-chained API fields; the public landing page uses an em-dash placeholder rather than a fake number pre-load.

**Loading/error/empty states:**
- Loading indicators are present almost everywhere (skeletons or spinners).
- **Error states are systemically absent.** Every list/dashboard fetch catches failures with `console.error()` only (`admin/dashboard/page.tsx:36-37`, `admin/graduates/page.tsx:25-26`, `company/dashboard/page.tsx:40-41`, `student/dashboard/page.tsx:44-45`, `student/profile/page.tsx:49-50`, and more) — `grep -rln "setError" client/app` returns only the login/activate forms. A failed API call is visually indistinguishable from "no data."
- **Empty states missing** on: `admin/dashboard/page.tsx:122,161,191,217` (programRankings/recentAlerts/topEmployers/topSkills), `admin/employment/page.tsx:77`, `admin/graduates/page.tsx:58`, `admin/training/page.tsx`, `company/dashboard/page.tsx:114,175`, `student/dashboard/page.tsx:161,249`, `student/profile/page.tsx:152,217,244`.
- Good counterexamples (correctly implemented): `admin/companies`, `admin/opportunities`, `admin/universities`, `admin/skill-gaps`, `admin/audit-logs`, `admin/reports`, `admin/alerts`, `company/applications`, `company/opportunities`, `student/jobs`, `student/opportunities`, `student/applications`, `student/training`, `opportunities/page.tsx`.

**Role-scoped views — confirmed gap:** `shared/constants/index.ts:32-47` defines 15 `UserRole` values, but `client/app` has only 3 UI surfaces (`admin/*`, `company/*`, `student/*`). `AppShell.tsx:47-97` explicitly documents (in-code comment) that every academic/leadership role sees the *same* admin pages, only reordered by `priorityByRole` (lines 77-84) and with 2 nav items conditionally hidden. Of the 9 non-student/company roles in spec (Leadership, Deans, Vice-Deans, Coordinators, Study Plan Directors, Training/Alumni Units), **none** has a distinct dashboard, page, or content branch — a dev-only role switcher at `AppShell.tsx:248-266` exists only to preview this nav reordering, underscoring that the "distinction" is cosmetic.

**Multi-role route guard status:** Route-level middleware protection exists and functions (role checks reject unauthorized roles), but see §2 items 1 and 14 for scoping gaps beneath the role layer.

---

## 5. Background Jobs, State Machines & Lifecycles

| State Machine | Transition Guard | Verified Behavior |
|---|---|---|
| `OpportunityStatus` (10 states) | `state-machine.util.ts:44-67`, `assertLegalTransition` | Terminal states (`ARCHIVED: []`) enforced; `CLOSED` cannot reopen to `PUBLISHED`; role-gated via `assertRoleCanTransition`; rejection requires non-empty reason. |
| `ApplicationStatus` | Reused `assertLegalTransition` | `SELECTED` triggers `ensureTrainingForApplication` (idempotent); `ACCEPTED` advances linked Training doc. |
| `TrainingStatus` | `state-machine.util.ts:123-130` | `NOMINATED→COMPANY_ADMISSION→UNIVERSITY_ACCREDITED→IN_TRAINING→{COMPLETED,TERMINATED}`, role-gated, audited; COMPLETED increments `Company.studentsTrained`. |
| `InterviewStatus` | `state-machine.util.ts:153-172` | `SCHEDULED↔RESCHEDULED`, both →`{COMPLETED,CANCELLED}`; result submission blocked once CANCELLED. |

**Scheduler status (`node-cron`, `server/src/jobs/scheduler.ts`):**
| Cron | Time | Job | Confirmed Wired? |
|---|---|---|---|
| `0 0 * * *` | 00:00 daily | `earlyWarningService.evaluateAllRules()` | Yes — `startScheduledJobs()` invoked at `server.ts:145` |
| `0 1 * * *` | 01:00 daily | `scanAndCreatePendingFollowUps()` (graduate milestones) | Yes |
| `0 2 * * *` | 02:00 daily | `skillGapService.refreshSkillGaps()` | Yes (bonus, not spec-required but real) |

**Dead/unused modules found during this pass:**
- `workflows/workflow.model.ts` — schema exists (OPPORTUNITY_APPROVAL/TRAINING_PLACEMENT/GRADUATION_CLEARANCE history), but **no controller/service/route references it anywhere** — entirely dead scaffolding.
- `academic-sync` — `MockSisConnector` (`academic-sync.service.ts:10-24`) always returns empty arrays and is never actually invoked by `executeSync`; the "sync" just re-counts existing local DB records and always reports success. Cosmetic, not a real external-SIS integration.
- `files` module — upload/download endpoints are explicitly mocked (`mock-s3-upload`, fabricated "signed" URLs) by the code's own comments; no real S3 SDK integration.

---

## 6. Actionable Punch-List

Prioritized by severity — **Critical/High items must be resolved before any production deployment.**

| Priority | File:Line | Fix Required |
|---|---|---|
| 🔴 P0 | `server/src/modules/auth/auth.controller.ts:75-79` | Remove the universal bypass password comparison (`password === 'admin@123' \|\| password === 'Password123!'`) from `login()`, or gate it strictly behind `NODE_ENV !== 'production'` — as written it is a live account-takeover vector on every account. |
| 🔴 P0 | `server/src/modules/auth/auth.controller.ts:36-52` | Same treatment for the `admin@gmail.com` + arbitrary-`role` demo login path. |
| 🔴 P0 | `server/src/modules/students/student.routes.ts:11` | Add a role guard to `GET /:id` (currently `authenticate` only — any logged-in user, including other students or company accounts, can fetch any student's full profile). |
| 🟠 P1 | `server/src/modules/students/student.controller.ts:72-109` | Add university/college/department filtering to `getStudents` derived from `req.user`, not left to optional query params. |
| 🟠 P1 | `server/src/modules/dashboards/dashboard.controller.ts:27-45` | Stop trusting client-supplied `universityId`/`collegeId`/etc.; derive scope strictly from `req.user`'s own assignment (or validate the requested scope is within the user's assignment tree). |
| 🟠 P1 | `server/src/config/database.ts:26-54` | Remove/gate the silent fallback to `MongoMemoryServer` behind non-production only; a production DB outage should fail loudly, not serve an empty ephemeral DB. |
| 🟠 P1 | `server/src/modules/job-offers/job-offer.controller.ts:15-30` | Validate `Student.findById(studentId)` (and `Training.findById(trainingId)` if provided) before `JobOffer.create`, matching the existence-check pattern used elsewhere (e.g. `application.controller.ts:30`). |
| 🟠 P1 | `client/lib/api.ts:45-48` | Implement the 401 handler: redirect to `/login` (clearing stored tokens) or attempt a silent refresh via the already-issued `POST /auth/refresh-token`. |
| 🟡 P2 | `server/src/modules/early-warnings/early-warning.service.ts` | Add the missing low-GPA/at-risk-student rule; replace the static `trainingToEmploymentRate ≤5%` proxy with a genuine period-over-period zero-hire trend check; wire `AlertRule` DB thresholds into the evaluation logic instead of ignoring them. |
| 🟡 P2 | `server/src/modules/companies/company.controller.ts:108-144` | Add automated threshold-based suggestion/derivation of `partnershipDecision` from `trainingToEmploymentRate`/`averageRating`, or explicitly document this as a human-in-the-loop-only field if that's intentional. |
| 🟡 P2 | `server/src/modules/courses/course.model.ts` | Add an index on `skills.skillId` — it's queried on every single match-score calculation (`matching.service.ts:156,171`), currently an unindexed hot path. |
| 🟡 P2 | All list/dashboard pages under `client/app/**` | Add a user-visible error state for failed fetches (currently `console.error` only) and empty-state fallbacks on the pages enumerated in §4. |
| 🟢 P3 | `client/app` (~9 roles) | Decide and implement real scoped dashboards for at least Deans/Coordinators/Supervisors, or explicitly descope this from the current spec if a single admin shell with reordered nav is the accepted design. |
| 🟢 P3 | `server/src/modules/workflows/`, `server/src/modules/files/` | Either wire up a real workflow engine / S3 integration, or remove the dead scaffolding to reduce confusion. |
| 🟢 P3 | `client/components/ui/AlertDialog.tsx` | Either use it for the success/error cases it was built for, or remove it. |
| 🟢 P3 | `server/src/modules/companies/company.model.ts` | Add an index on `isVerified`; review whether the existing `{sector,trainingToEmploymentRate}` compound index should be replaced with a single-field index matching the actual early-warning query shape. |
| 🟢 P3 | `server/package.json` | Remove unused `json2csv` dependency (CSV export is hand-rolled). |
