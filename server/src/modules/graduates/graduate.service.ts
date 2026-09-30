import { Graduate, GraduateFollowUp } from '../../models';

const MILESTONE_OFFSET_MONTHS: Record<string, number> = {
  '3_MONTHS': 3,
  '6_MONTHS': 6,
  '12_MONTHS': 12,
  '24_MONTHS': 24,
};

/**
 * Scans all graduates for milestones (3/6/12/24 months post-graduation) that
 * have come due, and pre-creates a PENDING GraduateFollowUp stub for each one
 * that doesn't already exist. `submitFollowUp` later fills the stub in via
 * upsert once the graduate (or staff) actually answers the survey.
 */
export async function scanAndCreatePendingFollowUps(): Promise<{ created: number }> {
  const graduates = await Graduate.find().select('_id studentId graduationDate').lean();
  const now = new Date();
  let created = 0;

  for (const graduate of graduates) {
    for (const [milestone, offsetMonths] of Object.entries(MILESTONE_OFFSET_MONTHS)) {
      const dueAt = new Date(graduate.graduationDate);
      dueAt.setMonth(dueAt.getMonth() + offsetMonths);
      if (dueAt > now) continue;

      const existing = await GraduateFollowUp.findOne({ graduateId: graduate._id, milestone });
      if (existing) continue;

      await GraduateFollowUp.create({
        graduateId: graduate._id,
        studentId: graduate.studentId,
        milestone,
        status: 'PENDING',
        dueAt,
      });
      created += 1;
    }
  }

  return { created };
}
