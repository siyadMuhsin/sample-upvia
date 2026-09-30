# Upvia (أبفيا) — University Employability & Career Intelligence Platform

> **UPGRADE • PROTECT • MOVE FORWARD**  
> *ارتقِ • احمِ • تقدّم*

Upvia is an enterprise-grade higher education employability and cooperative training platform designed to bridge university curricula, student internships, and industrial recruitment through deterministic scoring engines and real-time MongoDB analytics.

---

## 🏛 Platform Core Pillars

1. **Deterministic 7-Factor Matching Engine**:
   Transparent, explainable alignment between student competencies and employer job/internship criteria:
   * Specialization Match: **30%**
   * Skill Competency: **30%**
   * Academic Standing / Completed Credits: **15%**
   * GPA Qualification Ratio: **10%**
   * Prior Experience & Projects: **5%**
   * Location Proximity: **5%**
   * Institutional Badges & Extracurriculars: **5%**

2. **Full Co-op Training Lifecycle**:
   * Multi-stage opportunity accreditation & posting
   * Candidate shortlisting, interviews & offer management
   * Weekly milestone tracking, attendance verification & journals
   * Dual 10-dimension evaluation rubrics (academic supervisor + company mentor)
   * Post-internship permanent employment conversion

3. **Zero-Mock Labor Intelligence & Institutional Dashboards**:
   Live MongoDB aggregation pipelines computing:
   * 6-Month Graduate Employment Rate
   * Training-to-Employment Conversion Metrics
   * Curriculum Skill Gap Engine (identifying industry demand vs. accredited syllabus coverage)
   * College & Department Employability Rankings

4. **Native Bilingual Experience**:
   * Seamless English (LTR) and Arabic (RTL) localization via `next-intl`.
   * Designed with the Upvia Institutional Navy (`#0B1B3A`) and Royal Blue (`#1A56DB`) design system.

---

## 🗂 Repository Structure

This repository follows a strict decoupled standalone architecture:

```
upvia/
├── client/                     # Standalone Next.js 14 App Router (Port 3000)
│   ├── app/                    # Student, Company, and University Portals
│   ├── components/             # Reusable UI & Layout Components
│   ├── messages/               # English (en.json) & Arabic (ar.json) dictionaries
│   └── shared/                 # Local domain types & constants
├── server/                     # Standalone Node.js + Express REST API (Port 5000)
│   ├── src/modules/            # 15-Role RBAC feature modules
│   ├── src/seed/               # Institutional seed dataset & memory fallback
│   └── src/shared/             # Dual synchronized domain contracts
├── docs/                       # System architecture & domain specifications
│   └── changelog/              # Contributor work logs (siyad.md, sharafth.md)
├── .antigravity/               # Project workflow rules & enforcement
├── AGENTS.md                   # AI pair programming guidelines & rules
└── README.md                   # Repository overview
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Node.js**: 18.x or 20.x
* **MongoDB**: Local MongoDB 7+ or MongoDB Atlas connection (automatic fallback to embedded `mongodb-memory-server` if no URI provided)

### 1. Start the Backend API

```bash
cd server
npm install

# Seed the initial institutional dataset (KFUPM, Aramco, Elm, Students, Opportunities)
npm run seed

# Launch Express REST API (http://localhost:5000)
npm run dev
```

### 2. Start the Frontend Client

```bash
cd client
npm install

# Launch Next.js App Router (http://localhost:3000)
npm run dev
```

---

## 🔐 Sample Credentials & Demo Personas

> **Universal Credentials (Access All Roles)**:  
> * **Email**: `admin@gmail.com`  
> * **Password**: `admin@123`  
> *(This master account can log into **all 15 platform roles** via the login role dropdown or switch roles dynamically on the fly from the top navigation bar).*

All individual demo accounts also accept both **`admin@123`** and **`Password123!`**:

| Persona | Email Address | Role | Primary Portal |
|---|---|---|---|
| **Universal Admin (All Roles)** | `admin@gmail.com` | `SUPER_ADMIN` / Any | `/admin/dashboard` or any portal |
| **Student** | `student@upvia.com` | `STUDENT` | `/student/dashboard` |
| **University Leadership** | `leadership@upvia.com` | `UNIVERSITY_LEADERSHIP` | `/admin/dashboard` |
| **College Dean** | `dean.computing@upvia.com` | `COLLEGE_DEAN` | `/admin/dashboard` |
| **Program Coordinator** | `coordinator.se@upvia.com` | `PROGRAM_COORDINATOR` | `/admin/opportunities` |
| **Training Unit Head** | `training.unit@upvia.com` | `TRAINING_UNIT_HEAD` | `/admin/training` |
| **Industrial Partner (Aramco)** | `company.admin@upvia.com` | `COMPANY_ADMIN` | `/company/dashboard` |
| **Field Supervisor** | `supervisor@upvia.com` | `COMPANY_SUPERVISOR` | `/company/trainees` |

> *Tip: The login page at `http://localhost:3000/login` features a 1-Click Demo Persona Switcher and Target Role Selector to test workflows across all roles instantly.*

---

## 🛠 Engineering & Collaboration Standards

* **Dual Shared Types**: Types in `client/shared/` and `server/src/shared/` must always be identical. Verify with `diff -r client/shared server/src/shared`.
* **Zero Mock Data**: Never introduce hardcoded placeholder values in production controllers. Metrics must compute from live MongoDB collections.
* **Localization**: Every user-facing UI string must have corresponding entries in both `client/messages/en.json` and `client/messages/ar.json`.
* **Changelogs**: Record all significant work in [`docs/changelog/siyad.md`](file:///home/st/Desktop/TNL/upvia/docs/changelog/siyad.md) or [`docs/changelog/sharafth.md`](file:///home/st/Desktop/TNL/upvia/docs/changelog/sharafth.md).
* **AI Agent Guidelines**: Full operational contracts and architectural rules are documented in [`AGENTS.md`](file:///home/st/Desktop/TNL/upvia/AGENTS.md).

---

## 📄 Documentation

Deep-dive system documentation is available in [`docs/`](file:///home/st/Desktop/TNL/upvia/docs/):
* [System Architecture](file:///home/st/Desktop/TNL/upvia/docs/architecture.md)
* [Database Models & Indexes](file:///home/st/Desktop/TNL/upvia/docs/database.md)
* [REST API Endpoint Matrix](file:///home/st/Desktop/TNL/upvia/docs/api.md)
* [Deterministic Matching Rubric](file:///home/st/Desktop/TNL/upvia/docs/matching-engine.md)
* [Co-op Training Workflow](file:///home/st/Desktop/TNL/upvia/docs/training-workflow.md)
* [Analytics & Aggregation Pipelines](file:///home/st/Desktop/TNL/upvia/docs/analytics.md)

---

## ⚖️ License

Enterprise Proprietary — Upvia Technologies. All rights reserved.

