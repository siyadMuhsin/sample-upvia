# AGENTS.md — AI Agent Guidance & Strict Operational Rules

This document defines the official AI agent rules, engineering guidelines, and architectural contracts for the **Upvia** codebase. Any AI agent (or pair programmer) interacting with this repository MUST strictly abide by these rules.

---

## 1. Project Overview & Core Mission

**Upvia** is an enterprise-grade higher education employability and cooperative training platform designed to bridge university curricula, student internships, and industrial recruitment through deterministic scoring engines and real-time MongoDB analytics.

---

## 2. Supreme Repository Rules (Non-Negotiable)

### Rule 1: Directory Boundaries & Monorepo Prevention
- The root of this repository is strictly reserved for:
  - `client/` — Standalone Next.js 14 frontend.
  - `server/` — Standalone Node.js + Express backend.
  - `docs/` — System architecture and domain documentation.
  - `AGENTS.md` — AI agent rules and blueprints.
  - `README.md` — Project overview and quickstart guide.
  - `AUDIT.md` — Comprehensive architecture and security audit report.
  - `.gitignore` — Root repository ignore specifications.
  - `.antigravity/` — Project rule enforcement.
- **NEVER** create a root `package.json`, root `node_modules`, or root `shared/` folder.
- Terminal commands must ALWAYS be run with their working directory inside `client/` or `server/`, never at the workspace root.

### Rule 2: Dual Shared Type Synchronization
- Data contracts are mirrored locally in:
  - `client/shared/` (consumed by frontend via `@/shared`)
  - `server/src/shared/` (consumed by backend via relative `shared` imports)
- **Whenever modifying or adding an interface, type, or enum**, you MUST update BOTH files simultaneously to keep contracts 100% identical.
- Never cross-import between `client` and `server`.

### Rule 3: Zero Mock Data for Core Features
- Dashboards, KPIs, and reports must compute metrics dynamically from live MongoDB collections using aggregation pipelines.
- Do not introduce hardcoded fake values or placeholder functions (`// TODO: implement later`) in production controllers.

### Rule 4: Developer Changelog Protocol & Automatic Identity Detection (STRICT — NON-NEGOTIABLE)
- **This rule cannot be skipped, deferred, or forgotten for any reason.** A task — backend, frontend, docs, config, audit, or otherwise — is NOT considered complete until its corresponding changelog entry has been written. If an agent finishes a task and has not touched the changelog, that is a rule violation and must be corrected immediately, in the same turn if at all possible, without waiting to be reminded by the user.
- **Identity Detection**: At the beginning of any session or task execution, the agent must determine the active developer identity by inspecting Git configuration:
  ```bash
  git config user.name && git config user.email
  ```
- **Attribution & Routing Logic**:
  - If the name or email matches **Siyad** (e.g., `siyad`, `siyadsm4065@gmail.com`) $\rightarrow$ Log exclusively to `docs/changelog/siyad.md`.
  - If the name or email matches **Sharafath** (e.g., `sharafath`, `sharafathabi.dev@gmail.com`) $\rightarrow$ Log exclusively to `docs/changelog/sharafth.md`.
  - If the active user is a third contributor (neither Siyad nor Sharafath) $\rightarrow$ Dynamically create and maintain `docs/changelog/<username>.md`.
- **Strict Isolation**: Never contaminate Siyad's or Sharafath's changelogs with other contributors' work. Each contributor's file must strictly record only their own verified tasks.
- **Entry Structure**: Each log entry must record: Date (`[YYYY-MM-DD]`), Module(s), Task Type, Summary, Key Changes, and Files Modified / Created.
- **Every** task — including multi-part deliveries (e.g., a backend fix pass followed later by a frontend fix pass, even within the same conversation) — gets its OWN dated entry the moment that piece of work concludes. Do not batch several distinct completed tasks into a single deferred changelog update.
- Agents must proactively update the appropriate developer's changelog upon concluding or progressing any task — this is required agent behavior, not an optional courtesy.

---

## 3. Client Architecture & Frontend Rules (`client/`)

### Tech Stack
- **Framework**: Next.js 14 (App Router), React 18, TypeScript.
- **Styling**: Tailwind CSS, Lucide React icons.
- **State & Data Fetching**: TanStack React Query.
- **Internationalization**: `next-intl` (Bilingual English LTR & Arabic RTL).

### Frontend Rules
1. **Strict Localization**: Never hardcode user-facing strings in JSX. Every label, button, and message must be added to both `client/messages/en.json` and `client/messages/ar.json`.
2. **Mobile-First & Responsive**: All views and data tables must adapt smoothly across mobile, tablet, and desktop breakpoints.
3. **Path Aliases**:
   - Use `@/*` for internal client modules (`@/components`, `@/lib`, `@/app`).
   - Use `@/shared` for domain types and constants (`client/shared`).
4. **Clean Component Hierarchy**:
   - `client/components/layout/`: Shell, navigation, sidebar.
   - `client/components/ui/`: Reusable primitive components (DataTable, StatCard, StatusBadge, MatchScore).
   - `client/components/brand/`: UpviaLogo and branding assets.

---

## 4. Server Architecture & Backend Rules (`server/`)

### Tech Stack
- **Runtime**: Node.js, Express.js 4, TypeScript.
- **Database & ODM**: MongoDB 7+, Mongoose ODM 8.
- **Embedded Fallback**: Automatic `mongodb-memory-server` fallback for zero-config offline execution.

### Backend Rules
1. **Layered Structure**:
   - `server/src/modules/*/` contain domain features:
     - `*.routes.ts` $\rightarrow$ Endpoint declarations and middleware attachments.
     - `*.controller.ts` $\rightarrow$ Request parsing, response formatting, status codes.
     - `*.service.ts` $\rightarrow$ Business logic, aggregation pipelines, scoring calculations.
     - `*.model.ts` $\rightarrow$ Mongoose schemas, compound indexes, type casting.
2. **15-Role RBAC Authorization**:
   - Every protected route MUST use `authenticate` and `requireRole(...)` / `requirePermission(...)` middleware.
   - Never expose administrative or supervisor actions without role verification.
3. **Standard API Response Envelope**:
   - All controller endpoints must return responses conforming to the standard envelope:
     ```json
     {
       "success": true,
       "data": { ... },
       "message": "Human-readable summary message"
     }
     ```
   - Errors must be caught by `error.middleware.ts` and return `{ success: false, message, errors }`.
4. **Audit Logging**:
   - Every state transition (opportunity approvals, application reviews, training evaluations, job offers) must call `audit.util.ts` to log actor, action, previous status, and timestamp.
5. **Deterministic 7-Factor Matching Engine**:
   - Never alter the deterministic scoring weights without explicit instruction:
     - Specialization Match: 30%
     - Skill Competency: 30%
     - Academic Standing / Completed Credits: 15%
     - GPA Qualification Ratio: 10%
     - Prior Experience & Projects: 5%
     - Location Proximity: 5%
     - Badges & Extracurriculars: 5%

---

## 5. Security & Environment Standards

1. **Secrets Protection**:
   - Never write production credentials, secrets, or API keys directly into source code.
   - Store templates in `client/.env.example` and `server/.env.example`.
   - Never commit actual `.env` files.
2. **Input Sanitization & Validation**:
   - Validate request bodies using Zod or Mongoose validators.
   - Always hash passwords using `bcryptjs` with proper salt rounds.

---

## 6. Agent Execution Checklist

Before finishing any task, the AI agent must verify:
- [ ] Working directories respected (`cd client` or `cd server`).
- [ ] No extraneous files or monorepo artifacts added to root.
- [ ] Types in `client/shared/` and `server/src/shared/` match.
- [ ] Both English and Arabic translations provided for UI additions.
- [ ] Developer changelog updated (`docs/changelog/siyad.md` or `docs/changelog/sharafth.md`).
- [ ] Code compiles without TypeScript errors (`npx tsc --noEmit`).
- [ ] Existing comments and documentation preserved.
