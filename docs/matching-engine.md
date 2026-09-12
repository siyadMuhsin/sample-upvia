# Upvia Explainable Deterministic Matching Engine

## Conceptual Overview

Unlike opaque black-box machine learning models, Upvia features an **auditable, deterministic, and explainable matching engine**.

Every recommendation and match score produced by the engine provides an exact mathematical breakdown, explicit prerequisite justifications, and prescriptive actions that students can take to bridge identified skill gaps.

---

## Architectural Design

The matching engine is built around a pluggable provider pattern implementing the `MatchingProvider` interface:

```typescript
export interface MatchingProvider {
  calculateMatch(student: IStudentDocument, opportunity: IOpportunityDocument): Promise<IMatchResultData>;
  calculateBatchMatches(student: IStudentDocument, opportunities: IOpportunityDocument[]): Promise<IMatchResultData[]>;
}
```

The default engine, `RuleBasedMatchingProvider`, executes the institutional 7-factor scoring rubric.

---

## 7-Factor Weighted Scoring Rubric

The aggregate match score is computed as a normalized weighted linear combination:

$$\text{Overall Score} = \sum_{i=1}^{7} w_i \cdot s_i \quad \text{where} \quad \sum_{i=1}^{7} w_i = 100\%$$

```
+-------------------------------------------------------------+
| Factor                          | Weight | Metric Basis     |
+-------------------------------------------------------------+
| 1. Specialization / Degree Fit  | 30%    | Major / Program  |
| 2. Skill Overlap                | 30%    | Required Skills  |
| 3. Academic Standing & Courses  | 15%    | Completed Level  |
| 4. GPA Qualification            | 10%    | Min GPA Ratio    |
| 5. Prior Experience             | 5%     | Projects/Interns |
| 6. Location / Commute Fit       | 5%     | City / Remote    |
| 7. Certifications & Badges      | 5%     | Verified Awards  |
+-------------------------------------------------------------+
```

---

## Dimension Breakdown & Calculation Logic

### 1. Specialization & Major Fit (30%)
Evaluates whether the student's academic degree program is explicitly accredited or approved for the opportunity:
- If `student.programId` is listed in `opportunity.eligiblePrograms`: **100%**
- If student is in a related department within the same college: **70%**
- Unrelated program: **20%**

### 2. Skill Overlap (30%)
Calculates the Jaccard similarity and coverage of required vs. student acquired skills:
$$s_{\text{skills}} = \left( \frac{|\text{StudentSkills} \cap \text{RequiredSkills}|}{|\text{RequiredSkills}|} \times 80\% \right) + \left( \frac{|\text{StudentSkills} \cap \text{PreferredSkills}|}{|\text{PreferredSkills}|} \times 20\% \right)$$

### 3. Academic Standing & Prerequisites (15%)
Evaluates completed academic credits:
- Completed $\ge 90$ credit hours (Senior status): **100%**
- Completed $60 - 89$ credit hours (Junior status): **75%**
- Completed $< 60$ credit hours: **40%**

### 4. GPA Qualification (10%)
Proportional scoring against the employer's minimum GPA requirement:
- If $\text{GPA} \ge \text{MinGPA}$:
  $$s_{\text{gpa}} = 80 + 20 \times \left( \frac{\text{GPA} - \text{MinGPA}}{4.0 - \text{MinGPA}} \right)$$
- If $\text{GPA} < \text{MinGPA}$:
  $$s_{\text{gpa}} = \max\left(0, 80 \times \frac{\text{GPA}}{\text{MinGPA}}\right)$$

### 5. Prior Experience & Portfolio (5%)
Evaluates student portfolio, extracurricular verified projects, or prior internships.

### 6. Location Proximity (5%)
- Fully Remote opportunity: **100%**
- Matching City (e.g. Riyadh $\leftrightarrow$ Riyadh, Dhahran $\leftrightarrow$ Dhahran): **100%**
- Cross-provincial: **50%**

### 7. Certifications & Other Factors (5%)
Evaluates industry certifications (AWS, Cisco, PMP) and verified academic awards.

---

## Explainability & Prescription Layer

The matching engine generates human-readable explanations and prescriptive advice alongside numeric scores:

```json
{
  "overallScore": 88,
  "breakdown": {
    "specializationScore": 100,
    "skillOverlapScore": 80,
    "academicStandingScore": 100,
    "gpaScore": 95,
    "experienceScore": 70,
    "locationScore": 100,
    "otherFactorsScore": 80
  },
  "matchedSkills": ["TypeScript", "Node.js", "Docker", "MongoDB"],
  "missingSkills": ["Kubernetes", "AWS CloudFormation"],
  "explanation": "High alignment with Saudi Aramco Cloud Engineering Co-op. Candidate satisfies all academic degree prerequisites and exceeds GPA requirements (3.72 vs 3.00 minimum).",
  "recommendedActions": [
    "Enroll in SWE-421 (Cloud Native Architectures) to acquire missing Kubernetes competencies.",
    "Complete AWS Certified Cloud Practitioner badge to strengthen profile."
  ]
}
```

---

## Extending the Matching Engine

To integrate an alternative provider (e.g. an AI embedding vector-search provider or semantic LLM ranker), implement the `MatchingProvider` interface and register it in `backend/src/modules/matching/matching.service.ts`:

```typescript
export class VectorSemanticMatchingProvider implements MatchingProvider {
  async calculateMatch(student: IStudentDocument, opportunity: IOpportunityDocument): Promise<IMatchResultData> {
    // 1. Generate text embeddings of student profile & job description
    // 2. Compute cosine similarity
    // 3. Blend with deterministic institutional GPA/Major filters
    // 4. Return structured IMatchResultData
  }
}
```
