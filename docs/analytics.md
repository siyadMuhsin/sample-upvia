# Upvia Institutional Analytics & Labor Market Intelligence

## Overview

Upvia is built around a **Zero-Mock Data Architecture**. All executive metrics, accreditation ratios, program rankings, and labor market intelligence indicators are computed dynamically using **MongoDB Aggregation Pipelines**.

---

## Core Institutional Metrics & Ratios

### 1. 6-Month Graduate Employment Rate
- **Definition**: The percentage of tracked graduates who secure formal, degree-relevant employment within 180 days of graduation.
- **Formula**:
  $$\text{Employment Rate} = \left( \frac{\text{Employed Graduates within 6 Months}}{\text{Total Tracked Cohort Graduates}} \right) \times 100\%$$

### 2. Training-to-Employment (Co-op Conversion) Rate
- **Definition**: The percentage of cooperative training placements that directly convert into full-time employment offers from the host company.
- **Formula**:
  $$\text{Conversion Rate} = \left( \frac{\text{Accepted Job Offers from Host Employers}}{\text{Total Completed Co-op Placements}} \right) \times 100\%$$

### 3. Program Employability Ranking
- **Definition**: Normalized comparative index ranking academic degree programs by graduate placement velocity, average starting compensation, and industrial employer satisfaction.

### 4. Curriculum Skill Gap Index
- **Definition**: Real-time delta comparing the demand frequency of specific competencies in active enterprise job postings against the coverage of those skills in accredited university syllabi.

---

## MongoDB Aggregation Pipeline Implementations

### Aggregation 1: Sector Employment Distribution
Aggregates employment records grouped by company industry sectors to visualize labor absorption:

```javascript
db.employment_records.aggregate([
  {
    $lookup: {
      from: "companies",
      localField: "companyId",
      foreignField: "_id",
      as: "company"
    }
  },
  { $unwind: "$company" },
  {
    $group: {
      _id: "$company.sector",
      totalGraduatesHired: { $sum: 1 },
      averageStartingSalary: { $avg: "$monthlySalary" }
    }
  },
  {
    $project: {
      sector: "$_id",
      totalGraduatesHired: 1,
      averageStartingSalary: { $round: ["$averageStartingSalary", 2] },
      _id: 0
    }
  },
  { $sort: { totalGraduatesHired: -1 } }
]);
```

---

### Aggregation 2: Academic Program Employability Ranking
Computes placement percentage and average time-to-hire per academic program:

```javascript
db.graduates.aggregate([
  {
    $lookup: {
      from: "programs",
      localField: "programId",
      foreignField: "_id",
      as: "program"
    }
  },
  { $unwind: "$program" },
  {
    $group: {
      _id: "$program._id",
      programName: { $first: "$program.nameEn" },
      programCode: { $first: "$program.code" },
      totalGraduates: { $sum: 1 },
      employedCount: {
        $sum: { $cond: [{ $eq: ["$employmentStatus", "EMPLOYED"] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      programName: 1,
      programCode: 1,
      totalGraduates: 1,
      employedCount: 1,
      employmentRate: {
        $round: [
          { $multiply: [{ $divide: ["$employedCount", "$totalGraduates"] }, 100] },
          1
        ]
      }
    }
  },
  { $sort: { employmentRate: -1 } }
]);
```

---

### Aggregation 3: Curriculum Skill Gap Engine
Analyzes industry opportunity skill tags against course catalog learning outcomes:

```javascript
db.opportunities.aggregate([
  { $match: { status: { $in: ["ACCREDITED", "PUBLISHED"] } } },
  { $unwind: "$requiredSkills" },
  {
    $group: {
      _id: "$requiredSkills",
      marketDemandCount: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "skills",
      localField: "_id",
      foreignField: "_id",
      as: "skill"
    }
  },
  { $unwind: "$skill" },
  {
    $project: {
      skillName: "$skill.nameEn",
      category: "$skill.category",
      marketDemandCount: 1
    }
  },
  { $sort: { marketDemandCount: -1 } },
  { $limit: 15 }
]);
```

---

## Executive Dashboards & Export Formats

Institutional analytics are rendered in real-time within the Executive Portal (`/admin/dashboard` and `/admin/employment`) using **Recharts** visualizations:
- Historical employment trends by cohort.
- Co-op placement rates across colleges.
- Top hiring corporate partners.
- Live export in **CSV** (for university accreditation review committees) and **JSON** (for automated government reporting pipelines).
