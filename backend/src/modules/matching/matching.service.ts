import { IMatchScoreResult, IMatchingWeights, DEFAULT_MATCHING_WEIGHTS } from '@upvia/shared';
import { IStudentDocument } from '../students/student.model';
import { IOpportunityDocument } from '../opportunities/opportunity.model';

export interface MatchingProvider {
  calculateMatch(
    student: IStudentDocument,
    opportunity: IOpportunityDocument,
    weights?: Partial<IMatchingWeights>
  ): Promise<IMatchScoreResult>;
}

export class RuleBasedMatchingProvider implements MatchingProvider {
  async calculateMatch(
    student: IStudentDocument,
    opportunity: IOpportunityDocument,
    customWeights?: Partial<IMatchingWeights>
  ): Promise<IMatchScoreResult> {
    const weights: IMatchingWeights = {
      specialization: customWeights?.specialization ?? DEFAULT_MATCHING_WEIGHTS.SPECIALIZATION,
      skills: customWeights?.skills ?? DEFAULT_MATCHING_WEIGHTS.SKILLS,
      academicEligibility: customWeights?.academicEligibility ?? DEFAULT_MATCHING_WEIGHTS.ACADEMIC_ELIGIBILITY,
      gpa: customWeights?.gpa ?? DEFAULT_MATCHING_WEIGHTS.GPA,
      experience: customWeights?.experience ?? DEFAULT_MATCHING_WEIGHTS.EXPERIENCE,
      location: customWeights?.location ?? DEFAULT_MATCHING_WEIGHTS.LOCATION,
      other: customWeights?.other ?? DEFAULT_MATCHING_WEIGHTS.OTHER,
    };

    // 1. Specialization Match (0 - 100)
    let specializationScore = 0;
    const studentSpec = student.specialization.toLowerCase();
    const reqSpecs = opportunity.requiredSpecializations.map((s) => s.toLowerCase());
    if (reqSpecs.length === 0 || reqSpecs.includes(studentSpec) || reqSpecs.some((s) => studentSpec.includes(s) || s.includes(studentSpec))) {
      specializationScore = 100;
    } else {
      specializationScore = 20; // Partial adjacent field consideration
    }

    // 2. Skills Match & Skill Gap
    const matchedSkills: Array<{ skillId: string; name: string; studentLevel: number; requiredLevel: number }> = [];
    const missingSkills: Array<{ skillId: string; name: string; requiredLevel: number }> = [];

    const studentSkillsMap = new Map<string, number>();
    student.skills.forEach((s) => {
      studentSkillsMap.set(s.skillId.toString(), s.level);
      studentSkillsMap.set(s.skillNameEn.toLowerCase(), s.level);
    });

    let totalRequiredWeight = 0;
    let acquiredSkillScore = 0;

    opportunity.requiredSkills.forEach((reqSkill) => {
      totalRequiredWeight += reqSkill.minimumLevel;
      const studentLevel =
        studentSkillsMap.get(reqSkill.skillId.toString()) ||
        studentSkillsMap.get(reqSkill.skillNameEn.toLowerCase()) ||
        0;

      if (studentLevel >= reqSkill.minimumLevel) {
        acquiredSkillScore += reqSkill.minimumLevel;
        matchedSkills.push({
          skillId: reqSkill.skillId.toString(),
          name: reqSkill.skillNameEn,
          studentLevel,
          requiredLevel: reqSkill.minimumLevel,
        });
      } else if (studentLevel > 0) {
        acquiredSkillScore += studentLevel * 0.7; // Partial credit for lower level
        matchedSkills.push({
          skillId: reqSkill.skillId.toString(),
          name: reqSkill.skillNameEn,
          studentLevel,
          requiredLevel: reqSkill.minimumLevel,
        });
      } else {
        missingSkills.push({
          skillId: reqSkill.skillId.toString(),
          name: reqSkill.skillNameEn,
          requiredLevel: reqSkill.minimumLevel,
        });
      }
    });

    const skillsScore = totalRequiredWeight > 0 ? (acquiredSkillScore / totalRequiredWeight) * 100 : 100;

    // 3. Academic Eligibility Check
    const eligibilityReasons: string[] = [];
    let academicEligibilityScore = 100;

    if (student.gpa < opportunity.minimumGPA) {
      academicEligibilityScore -= 50;
      eligibilityReasons.push(`GPA (${student.gpa.toFixed(2)}) is below minimum required (${opportunity.minimumGPA.toFixed(2)})`);
    }

    if (student.creditsCompleted < 60) {
      academicEligibilityScore -= 40;
      eligibilityReasons.push(`Completed credits (${student.creditsCompleted}) are below eligible standing`);
    }

    academicEligibilityScore = Math.max(0, academicEligibilityScore);
    const eligible = academicEligibilityScore >= 50;

    // 4. GPA Score (Normalized: 3.0 = 60%, 4.0 = 80%, 5.0 = 100%)
    const gpaRatio = Math.min(student.gpa / (student.maxGpa || 5.0), 1.0);
    const gpaScore = Math.round(gpaRatio * 100);

    // 5. Experience Score
    const studentProjectsCount = student.projects.length;
    let experienceScore = Math.min(studentProjectsCount * 25, 100);
    if (opportunity.experienceYears === 0) {
      experienceScore = 100; // Entry level / internship doesn't penalize
    }

    // 6. Location Match (City match or Remote mode)
    let locationScore = 100;
    if (opportunity.workMode !== 'REMOTE') {
      // In this version, assume high match if within country or remote
      locationScore = 90;
    }

    // 7. Other criteria (Certifications, Activities)
    const otherScore = Math.min(50 + student.certificates.length * 20 + student.activities.length * 15, 100);

    // Weighted Final Score
    const finalScore = Math.round(
      specializationScore * weights.specialization +
      skillsScore * weights.skills +
      academicEligibilityScore * weights.academicEligibility +
      gpaScore * weights.gpa +
      experienceScore * weights.experience +
      locationScore * weights.location +
      otherScore * weights.other
    );

    // Recommended Courses & Matched Courses mapping
    const matchedCourses: Array<{ courseCode: string; name: string }> = [];
    const recommendedCourses: Array<{ courseCode: string; name: string; targetSkill: string }> = [];

    // Derive matched/recommended from missing skills
    missingSkills.forEach((missing) => {
      recommendedCourses.push({
        courseCode: `REC-${missing.name.slice(0, 3).toUpperCase()}`,
        name: `Applied ${missing.name} in Enterprise Systems`,
        targetSkill: missing.name,
      });
    });

    const explanation = `${finalScore}% match. ${matchedSkills.length} of ${opportunity.requiredSkills.length} required skills matched. Specialization alignment is ${specializationScore}%. GPA criteria met with ${student.gpa.toFixed(2)} / ${student.maxGpa}.`;

    return {
      score: Math.min(100, Math.max(0, finalScore)),
      breakdown: {
        specializationScore: Math.round(specializationScore),
        skillsScore: Math.round(skillsScore),
        academicEligibilityScore: Math.round(academicEligibilityScore),
        gpaScore: Math.round(gpaScore),
        experienceScore: Math.round(experienceScore),
        locationScore: Math.round(locationScore),
        otherScore: Math.round(otherScore),
      },
      matchedSkills,
      missingSkills,
      matchedCourses,
      recommendedCourses,
      eligibility: {
        eligible,
        reasons: eligibilityReasons,
      },
      explanation,
    };
  }
}

export const defaultMatchingProvider = new RuleBasedMatchingProvider();
