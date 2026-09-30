# Upvia REST API Reference

## API Protocol & Conventions

- **Base URL**: `http://localhost:5000/api/v1`
- **Transport**: HTTPS (HTTP in local dev)
- **Data Format**: `application/json`
- **Authentication**: JWT Bearer token in the `Authorization` header:
  ```http
  Authorization: Bearer <jwt_access_token>
  ```

---

## Standard Response Envelopes

### 1. Single Entity / Command Response
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "_id": "66e2c34a...",
    "title": "Software Engineering Co-op"
  }
}
```

### 2. Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

### 3. Error Response
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials provided",
    "code": "UNAUTHORIZED",
    "details": null
  }
}
```

---

## Endpoint Catalog

### 1. Authentication (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticates credentials and returns JWT token + user profile |
| `POST` | `/auth/register` | Public | Registers a new user account |
| `GET` | `/auth/me` | Bearer | Returns the authenticated user's current session |
| `POST` | `/auth/refresh` | Bearer | Refreshes the active JWT access token |

#### Example: `POST /auth/login`
```json
// Request:
{
  "email": "student@upvia.com",
  "password": "Password123!"
}

// Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "66e2c3...",
      "email": "student@upvia.com",
      "role": "STUDENT",
      "firstNameEn": "Abdullah",
      "lastNameEn": "Al-Ghamdi"
    }
  }
}
```

---

### 2. Academic Infrastructure (`/academic`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/academic/universities` | Public | Any | List all universities |
| `GET` | `/academic/colleges` | Public | Any | List colleges, filterable by `universityId` |
| `GET` | `/academic/departments` | Public | Any | List departments, filterable by `collegeId` |
| `GET` | `/academic/programs` | Public | Any | List programs, filterable by `departmentId` |
| `GET` | `/academic/batches` | Bearer | Academic Staff | List academic cohorts and batches |

---

### 3. Students (`/students`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/students` | Bearer | Academic Staff | Paginated list of student profiles |
| `GET` | `/students/me` | Bearer | Student | Returns the authenticated student's profile |
| `PUT` | `/students/me` | Bearer | Student | Updates student profile (bio, skills, resume) |
| `GET` | `/students/:id` | Bearer | Academic / Company | Retrieves student profile by ID |

---

### 4. Companies (`/companies`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/companies` | Public | Any | List verified corporate partners |
| `POST` | `/companies` | Bearer | Company Admin | Register new industrial partner organization |
| `GET` | `/companies/:id` | Public | Any | Retrieve company details and stats |
| `PATCH` | `/companies/:id/status` | Bearer | University Admin | Verify, suspend, or reject company accreditation |

---

### 5. Opportunities (`/opportunities`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/opportunities` | Public | Any | Filterable catalog (type, status, location) |
| `POST` | `/opportunities` | Bearer | Company Staff | Create a new opportunity (starts in `SUBMITTED`) |
| `GET` | `/opportunities/:id` | Public | Any | Retrieve opportunity details |
| `PATCH` | `/opportunities/:id/status` | Bearer | Academic / Admin | Transition status (`ACCREDITED`, `REJECTED`, `PUBLISHED`) |

---

### 6. Applications (`/applications`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/applications` | Bearer | Student | Submit application for an opportunity |
| `GET` | `/applications/my` | Bearer | Student | View current student's applications |
| `GET` | `/applications/opportunity/:id` | Bearer | Company / Admin | View applicants for an opportunity |
| `PATCH` | `/applications/:id/status` | Bearer | Company / Admin | Update stage (`SHORTLISTED`, `ACCEPTED`, `REJECTED`) |

---

### 7. Explainable Matching Engine (`/matching`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/matching/student/:id/opportunities` | Bearer | Student / Advisor | Computes deterministic match scores for all opportunities |
| `GET` | `/matching/opportunity/:id/candidates` | Bearer | Company / Admin | Computes match rankings for all eligible candidates |
| `POST` | `/matching/explain` | Bearer | Any Authenticated | Returns exact 7-factor mathematical score breakdown |

#### Example: `GET /matching/student/me/opportunities`
```json
{
  "success": true,
  "data": [
    {
      "opportunityId": "66e2b810...",
      "title": "Cloud Solutions Co-op",
      "company": "Saudi Aramco",
      "overallScore": 94,
      "breakdown": {
        "specializationScore": 100,
        "skillOverlapScore": 90,
        "academicStandingScore": 100,
        "gpaScore": 92,
        "experienceScore": 80,
        "locationScore": 100,
        "otherFactorsScore": 85
      },
      "matchedSkills": ["Node.js", "Docker", "MongoDB", "TypeScript"],
      "missingSkills": ["Kubernetes"],
      "recommendedActions": [
        "Take course SWE-421 (Cloud Native Architectures) to close the Kubernetes skill gap."
      ]
    }
  ]
}
```

---

### 8. Co-op Training Lifecycle (`/training`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/training/my` | Bearer | Student | Active placement details, hours, and status |
| `GET` | `/training/company/trainees` | Bearer | Company Staff | List active trainees supervised by company |
| `GET` | `/training/admin/all` | Bearer | University Admin | Institutional placement overview |
| `POST` | `/training/:id/attendance` | Bearer | Student / Supervisor | Log or verify daily attendance |
| `POST` | `/training/:id/tasks` | Bearer | Supervisor | Assign new training milestone/task |
| `POST` | `/training/:id/reports` | Bearer | Student | Submit weekly training progress report |

---

### 9. Evaluations (`/evaluations`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/evaluations/supervisor` | Bearer | Supervisor | Submit 10-dimension trainee evaluation |
| `POST` | `/evaluations/student` | Bearer | Student | Submit 7-dimension workplace evaluation |
| `GET` | `/evaluations/training/:id` | Bearer | Academic / Admin | Retrieve all evaluations for a placement |

---

### 10. Job Offers (`/job-offers`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/job-offers` | Bearer | Company Admin | Issue formal employment offer to trainee |
| `GET` | `/job-offers/my` | Bearer | Student | View offers extended to current student |
| `PATCH` | `/job-offers/:id/respond` | Bearer | Student | Accept or decline employment offer |

---

### 11. Institutional Analytics & Dashboards (`/analytics` & `/dashboards`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/analytics/employment-rate` | Bearer | University Staff | Overall 6-month employment rate |
| `GET` | `/analytics/training-to-employment` | Bearer | University Staff | Co-op to permanent conversion rate |
| `GET` | `/analytics/program-rankings` | Bearer | University Staff | Employability rankings by major |
| `GET` | `/analytics/top-skills` | Bearer | Any Authenticated | Highest-demand industry skills |
| `GET` | `/dashboards/executive` | Bearer | University Leadership | High-level institutional KPI rollups |

---

### 12. Early Warning & Quality Assurance (`/early-warnings`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/early-warnings` | Bearer | University Staff | List active unresolved warnings |
| `POST` | `/early-warnings/evaluate` | Bearer | University Staff | Triggers rule evaluation engine |
| `PATCH` | `/early-warnings/:id/resolve` | Bearer | University Staff | Marks alert as investigated/resolved |

---

### 13. Reports & Enterprise Exports (`/reports`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/reports/generate` | Bearer | Academic Staff | Compiles and exports dataset (CSV / JSON) |
| `GET` | `/reports/history` | Bearer | Academic Staff | Audit log of previously generated reports |

---

### 14. Audit Telemetry (`/audit`)
| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/audit` | Bearer | University Admin | Query immutable administrative audit logs |
