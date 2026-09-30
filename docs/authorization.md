# Upvia Role-Based Access Control (RBAC) & Authorization

## RBAC Architecture

Upvia enforces a fine-grained, 15-role hierarchical access control matrix designed to mirror the institutional governance of tier-1 universities and multi-department corporate partners.

Authorization is enforced at two distinct layers:
1. **Route-Level RBAC Middleware**: Filters incoming HTTP requests based on user role enums.
2. **Resource-Level Policy Checks**: Verifies entity ownership (e.g. students accessing only their own applications, or supervisors reviewing only trainees assigned to their company).

---

## The 15 Institutional Roles

### Tier 1: System & Institutional Leadership
1. `SUPER_ADMIN`: Full cross-tenant platform administration and configuration.
2. `UNIVERSITY_LEADERSHIP`: University President, Vice-Rectors, and Provosts. Full read access to institutional KPIs, accreditation metrics, and macro employment trends.

### Tier 2: Academic Faculty & Department Governance
3. `COLLEGE_DEAN`: Dean of an academic college (e.g., College of Computing). Oversees programs, curriculum reviews, and college-wide placement statistics.
4. `DEPARTMENT_HEAD`: Head of an academic department (e.g., Department of Software Engineering). Approves study plans, course skill mappings, and tracks departmental metrics.
5. `PROGRAM_COORDINATOR`: Academic coordinator responsible for validating opportunity relevance to degree requirements and approving co-op prerequisites.
6. `TRAINING_SUPERVISOR`: Faculty member assigned to supervise academic progress of student trainees during their off-campus field placement.
7. `ACADEMIC_ADVISOR`: Faculty advisor monitoring student degree completion, prerequisites, and co-op eligibility.

### Tier 3: Central Career & Co-op Units
8. `CAREER_CENTER_DIRECTOR`: Executive lead for institutional employability, employer relations, and career development initiatives.
9. `CAREER_CENTER_COUNSELOR`: Advises students on resume building, interview preparation, and job matching.
10. `TRAINING_UNIT_HEAD`: Head of the central university Co-op & Internship Training Unit. Grants final formal accreditation to company training opportunities.
11. `TRAINING_UNIT_COORDINATOR`: Operational coordinator handling student onboarding, site visits, and institutional documentation.
12. `INDUSTRIAL_RELATIONS_MANAGER`: Liaison managing enterprise employer partnerships, MoUs, and high-volume recruiting agreements.

### Tier 4: Industrial Partners
13. `COMPANY_ADMIN`: Corporate administrator managing organization profile, posting opportunities, issuing job offers, and designating mentors.
14. `COMPANY_SUPERVISOR`: Field mentor actively supervising students in the workplace, logging attendance verifications, and completing the 10-dimension rubric.

### Tier 5: Students & Alumni
15. `STUDENT`: Enrolled student or recent graduate seeking co-op training, completing field assignments, and tracking their career progress.

---

## Access Control Matrix

| Functional Area / Action | Leadership / Deans | Coordinators / Training Units | Company Staff | Students |
|---|---|---|---|---|
| **View Executive Dashboards** | Full Read | Read-Only | Denied | Denied |
| **Accredit Opportunities** | Read | Full Approval | Denied | Denied |
| **Post Opportunities** | Denied | Create/Edit | Create/Edit | Denied |
| **Apply to Opportunities** | Denied | Denied | Denied | Create/Edit |
| **Deterministic Match Scoring** | Read | Full Read | Rank View | View Own |
| **Verify Daily Attendance** | Read | Oversee | Approve/Reject | Submit Own |
| **Submit Supervisor Evaluation** | Read | Review | Create/Edit | Denied |
| **Submit Workplace Feedback** | Read | Review | Aggregate Only | Create/Edit |
| **Issue Job Offers** | Read | Monitor | Create/Manage | Accept/Decline |
| **Curriculum Skill Gap Engine** | Full Access | Full Access | Demand View | Action Recommendations |
| **Export Audit Logs & Reports** | Full Access | Authorized Only | Denied | Denied |

---

## Middleware Implementation

Authorization is implemented via composable Express middleware:

```typescript
// Enforce authentication
router.use(authenticate);

// Restrict to specific roles
router.post('/accredit', requireRole([
  UserRole.TRAINING_UNIT_HEAD,
  UserRole.PROGRAM_COORDINATOR,
  UserRole.SUPER_ADMIN
]), controller.accreditOpportunity);

// Restrict to any academic staff member
router.get('/curriculum-gaps', requireAcademicStaff, controller.getGaps);

// Restrict to company representatives
router.post('/trainees/evaluations', requireCompanyStaff, controller.submitEvaluation);
```
