# Upvia — University Employability, Co-op Training & Career Intelligence Platform

> **UPGRADE • PROTECT • MOVE FORWARD**
> 
> *A unified national infrastructure bridging higher education curricula, cooperative training workflows, explainable AI opportunity matching, and longitudinal graduate career tracking.*

---

## Executive Summary

**Upvia** is an enterprise-grade higher education employability platform built from scratch to unify universities, industrial employers, and students. Upvia replaces disconnected spreadsheets and siloed internship portals with an auditable, multi-stakeholder operational platform backed by real-time MongoDB analytics and explainable matching.

---

## Core Technology Stack

Upvia is built strictly on the designated modern JavaScript/TypeScript stack:

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, next-intl (Bilingual English LTR & Arabic RTL).
- **Backend**: Node.js, Express.js, TypeScript.
- **Database & ODM**: MongoDB 7+, Mongoose ODM 8 (with compound indexes, data validation, and real-time aggregation pipelines).
- **Embedded Zero-Config Fallback**: Automatic in-memory MongoDB fallback (`mongodb-memory-server`) enables immediate local execution without external database installation.

---

## Key Platform Capabilities

### 1. 15-Role Hierarchical Access Control (RBAC)
Deep institutional governance modeling every stakeholder in the employability ecosystem:
- **University Leadership**: Institutional President, Provost, College Deans, Department Heads.
- **Academic Staff**: Program Coordinators, Academic Advisors, Training Supervisors.
- **Career & Training Units**: Career Center Directors, Counselors, Training Unit Heads, Industrial Relations Managers.
- **Industrial Partners**: Company Admins, HR Managers, Field Supervisors.
- **Students & Alumni**: Enrolled Candidates, Active Co-op Trainees, Tracked Graduates.

### 2. Explainable Deterministic Matching Engine
Deterministic 7-factor weighted scoring rubric ($100\%$ total):
- **Specialization & Major Match**: 30%
- **Skill Competency Overlap**: 30%
- **Academic Standing & Completed Credits**: 15%
- **GPA Qualification Ratio**: 10%
- **Prior Experience & Projects**: 5%
- **Location Proximity / Remote**: 5%
- **Institutional Badges & Certifications**: 5%
*Provides students with human-readable score breakdowns, missing prerequisites, and recommended corrective courses.*

### 3. End-to-End Co-op Training Lifecycle
- **Opportunity Accreditation**: Multi-step approval by Program Coordinators and Training Unit Heads.
- **Application & Interview Pipeline**: Candidate shortlisting, interview scheduling, and offer letters.
- **Active Placement Supervision**: Weekly timestamped attendance verification, task milestones, and student journals.
- **Dual Rigorous Rubrics**: 10-dimension supervisor evaluation rubric + 7-dimension student workplace feedback.
- **Post-Coop Job Offers**: Seamless conversion of high-performing trainees to full-time permanent employees.

### 4. Zero-Mock Institutional Analytics & Labor Intelligence
All dashboard figures, KPIs, and reports are computed dynamically from real MongoDB collections:
- 6-Month Graduate Employment Rate.
- Training-to-Employment (Co-op conversion) Rate.
- Academic Program Employability Rankings.
- Macro Economic Sector Distribution & Salary Benchmarks.
- Curriculum Skill Gap Engine identifying industry competencies missing from accredited syllabi.

### 5. Native Bilingual Experience (English & Arabic)
- Fluid English (LTR) and Arabic (RTL) localization.
- Curated typography: `Archivo` for Latin and `Cairo` for Arabic.
- Upvia Brand Design System: 70% White / 20% Institutional Navy (`#0B1B3A`) / 10% Royal Blue (`#1A56DB`) and Accent Cyan (`#22D3EE`).

---

## Monorepo Architecture

```
upvia/
├── docker-compose.yml         # Containerized production orchestration
├── docs/                      # Enterprise system architecture documentation
│   ├── architecture.md        # System layers, data flow & diagrams
│   ├── database.md            # 25+ Mongoose models, schemas & compound indexes
│   ├── api.md                 # Complete REST API endpoint reference
│   ├── authentication.md      # JWT tokens, password hashing & sessions
│   ├── authorization.md       # 15-role RBAC matrix & middleware
│   ├── matching-engine.md     # Deterministic 7-factor scoring engine
│   ├── training-workflow.md   # 5-phase co-op training lifecycle
│   ├── analytics.md           # MongoDB aggregation pipelines & KPIs
│   ├── deployment.md          # Docker, environment variables & ops
│   └── academic-integration.md# University SIS/Banner/PeopleSoft connector
├── shared/                    # Shared TypeScript package (@upvia/shared)
│   └── src/
│       ├── constants/         # Roles, statuses, weights, brand tokens
│       └── types/             # Domain interfaces & API contracts
├── backend/                   # Express.js + Mongoose REST API (Port 5000)
│   ├── Dockerfile
│   └── src/
│       ├── models/            # 25+ Mongoose models with compound indexes
│       ├── modules/           # Feature controllers, services & routes
│       └── seed/              # Institutional seed dataset
└── frontend/                  # Next.js 14 App Router (Port 3000)
    ├── Dockerfile
    ├── app/                   # Public, Student, Company & Admin portals
    ├── components/            # Design system, AppShell, brand marks, charts
    ├── lib/                   # API client, auth context, i18n
    └── messages/              # English and Arabic translation dictionaries
```

---

## Quickstart Guide

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- npm 9+
- *(Optional)* Docker and Docker Compose

### 1. Installation & Build
```bash
# Clone the repository and install dependencies across the monorepo:
npm install

# Build the shared domain package:
npm run build:shared

# Build backend and frontend:
npm run build:backend
npm run build:frontend
```

### 2. Seed Initial Institutional Database
Populates King Fahd University of Petroleum & Minerals (KFUPM), 5 Colleges, Programs, Skills, Industrial Partners (Saudi Aramco, Elm, STC Solutions, Lucid Motors), Students, Co-op Placements, Evaluations, and Job Offers:

```bash
npm run seed
```

### 3. Run Automated Test Suite
```bash
npm test
```
*Validates the deterministic matching engine, RBAC middleware, and REST API integration endpoints.*

### 4. Start Development Servers
```bash
# In terminal 1 (starts Express REST API on http://localhost:5000):
npm run dev:backend

# In terminal 2 (starts Next.js App Router on http://localhost:3000):
npm run dev:frontend
```

---

## Seeded Demo Accounts

All demo accounts share the password: **`Password123!`**

| Operational Persona | Email Address | Role | Accessible Portal |
|---|---|---|---|
| **Student** | `student@upvia.com` | `STUDENT` | `/student/dashboard` |
| **University Leadership** | `leadership@upvia.com` | `UNIVERSITY_LEADERSHIP` | `/admin/dashboard` |
| **Program Coordinator (SE)** | `coordinator.se@upvia.com` | `PROGRAM_COORDINATOR` | `/admin/opportunities` |
| **Training Unit Head** | `training.unit@upvia.com` | `TRAINING_UNIT_HEAD` | `/admin/training` |
| **Industrial Partner (Aramco)**| `company.admin@upvia.com` | `COMPANY_ADMIN` | `/company/dashboard` |
| **Field Supervisor** | `supervisor@upvia.com` | `COMPANY_SUPERVISOR` | `/company/trainees` |

> **Rapid Role Switcher**:
> The login screen at `http://localhost:3000/login` features a **1-Click Demo Persona Picker** that instantly signs you in as any role to test workflows from both academic and corporate viewpoints.

---

## Production Docker Deployment

To build and launch the entire multi-container production stack with MongoDB and Redis:

```bash
docker-compose up -d --build
```
Access the application:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1`

---

## System Documentation

For detailed technical specifications, refer to the documentation in [`docs/`](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/):
- [Architecture & Data Flow](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/architecture.md)
- [Database Models & Indexes](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/database.md)
- [REST API Specifications](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/api.md)
- [Authentication Architecture](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/authentication.md)
- [Role-Based Access Control (RBAC)](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/authorization.md)
- [Deterministic Matching Engine](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/matching-engine.md)
- [Co-op Training Lifecycle](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/training-workflow.md)
- [Institutional Analytics & Aggregations](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/analytics.md)
- [Deployment & Operations](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/deployment.md)
- [Academic SIS Integration](file:///Users/siyadmuhsin/Documents/TNL/upvia/docs/academic-integration.md)

---

## License

Enterprise Proprietary — Copyright © Upvia Technologies. All rights reserved.
