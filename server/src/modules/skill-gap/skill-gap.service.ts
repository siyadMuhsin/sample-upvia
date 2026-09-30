import mongoose from 'mongoose';
import { Opportunity, StudyPlan, Course, Program, SkillGap } from '../../models';
import { OpportunityStatus } from '../../shared';

interface SkillDemand {
  skillId: mongoose.Types.ObjectId;
  skillName: string;
  demandCount: number;
}

const CRITICAL_GAP_THRESHOLD = 40;
const MODERATE_GAP_THRESHOLD = 15;

/**
 * Curriculum Skill-Gap Intelligence Engine.
 *
 * Replaces the previously-static seed-only SkillGap rows with a real,
 * recomputable correlation between:
 *  - market demand: how often a skill is required across currently-published
 *    Opportunities, and
 *  - program coverage: how deeply that skill is taught across the courses in
 *    each program's published StudyPlan (Course links to Department, not
 *    directly to Program, so coverage is derived via
 *    StudyPlan.courses[].courseId -> Course.skills[].levelTaught).
 */
export class SkillGapService {
  async refreshSkillGaps(): Promise<{ upserted: number; skillsConsidered: number; programsConsidered: number }> {
    const totalPublished = await Opportunity.countDocuments({ status: OpportunityStatus.PUBLISHED });
    if (totalPublished === 0) return { upserted: 0, skillsConsidered: 0, programsConsidered: 0 };

    const demandAgg: SkillDemand[] = await Opportunity.aggregate([
      { $match: { status: OpportunityStatus.PUBLISHED } },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.skillId',
          skillName: { $first: '$requiredSkills.skillNameEn' },
          demandCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, skillId: '$_id', skillName: 1, demandCount: 1 } },
    ]);

    if (demandAgg.length === 0) return { upserted: 0, skillsConsidered: 0, programsConsidered: 0 };

    const programs = await Program.find().select('_id').lean();
    const studyPlans = await StudyPlan.find({ isPublished: true }).select('programId courses').lean();

    let upserted = 0;

    for (const program of programs) {
      const plan = studyPlans.find((p) => p.programId.toString() === program._id.toString());
      const courseIds = plan ? plan.courses.map((c) => c.courseId) : [];
      const courses = courseIds.length
        ? await Course.find({ _id: { $in: courseIds } }).select('skills').lean()
        : [];

      for (const demand of demandAgg) {
        const marketDemandPercentage = Math.min(100, Math.round((demand.demandCount / totalPublished) * 100));

        const levelsTaught: number[] = [];
        courses.forEach((c) => {
          c.skills.forEach((s) => {
            if (s.skillId.toString() === demand.skillId.toString()) levelsTaught.push(s.levelTaught);
          });
        });
        const avgLevelTaught = levelsTaught.length
          ? levelsTaught.reduce((a, b) => a + b, 0) / levelsTaught.length
          : 0;
        const programCoveragePercentage = Math.round((avgLevelTaught / 5) * 100);

        // Skip pairs with no signal at all (skill neither in demand nor taught here).
        if (marketDemandPercentage === 0 && programCoveragePercentage === 0) continue;

        const gapPercentage = Math.max(0, marketDemandPercentage - programCoveragePercentage);
        const status =
          gapPercentage >= CRITICAL_GAP_THRESHOLD
            ? 'CRITICAL_GAP'
            : gapPercentage >= MODERATE_GAP_THRESHOLD
            ? 'MODERATE_GAP'
            : 'OPTIMAL';

        const recommendedAction =
          status === 'CRITICAL_GAP'
            ? `Urgently introduce or expand coverage of ${demand.skillName} — market demand (${marketDemandPercentage}%) significantly outpaces current curriculum coverage (${programCoveragePercentage}%).`
            : status === 'MODERATE_GAP'
            ? `Strengthen ${demand.skillName} coverage in existing courses to keep pace with market demand.`
            : `${demand.skillName} coverage is currently aligned with market demand.`;

        await SkillGap.findOneAndUpdate(
          { programId: program._id, skillId: demand.skillId },
          {
            programId: program._id,
            skillId: demand.skillId,
            skillName: demand.skillName,
            marketDemandPercentage,
            programCoveragePercentage,
            gapPercentage,
            status,
            recommendedAction,
          },
          { upsert: true, new: true }
        );
        upserted += 1;
      }
    }

    return { upserted, skillsConsidered: demandAgg.length, programsConsidered: programs.length };
  }
}

export const skillGapService = new SkillGapService();
