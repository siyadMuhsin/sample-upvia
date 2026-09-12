import { Graduate, EmploymentRecord, Training, Company, Opportunity, SkillGap, Student, Program } from '../../models';

export class AnalyticsService {
  /**
   * Overall University Employment Rate
   */
  async getEmploymentRate(filter: { universityId?: string; collegeId?: string; programId?: string } = {}) {
    const matchFilter: any = {};
    if (filter.programId) matchFilter.programId = filter.programId;
    if (filter.collegeId) matchFilter.collegeId = filter.collegeId;
    if (filter.universityId) matchFilter.universityId = filter.universityId;

    const stats = await Graduate.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalGraduates: { $sum: 1 },
          employedGraduates: {
            $sum: {
              $cond: [{ $eq: ['$employmentStatus', 'EMPLOYED'] }, 1, 0],
            },
          },
          seekingGraduates: {
            $sum: {
              $cond: [{ $eq: ['$employmentStatus', 'SEEKING'] }, 1, 0],
            },
          },
          higherStudiesGraduates: {
            $sum: {
              $cond: [{ $eq: ['$employmentStatus', 'HIGHER_STUDIES'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalGraduates: 1,
          employedGraduates: 1,
          seekingGraduates: 1,
          higherStudiesGraduates: 1,
          employmentRate: {
            $cond: [
              { $gt: ['$totalGraduates', 0] },
              { $round: [{ $multiply: [{ $divide: ['$employedGraduates', '$totalGraduates'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
    ]);

    return stats[0] || { totalGraduates: 0, employedGraduates: 0, seekingGraduates: 0, higherStudiesGraduates: 0, employmentRate: 0 };
  }

  /**
   * Training-to-Employment Rate (Students employed after training / students who completed training * 100)
   */
  async getTrainingToEmploymentRate(filter: { universityId?: string; collegeId?: string; programId?: string } = {}) {
    const completedTrainings = await Training.countDocuments({ status: 'COMPLETED' });
    const postTrainingHires = await EmploymentRecord.countDocuments({ isPostTrainingHire: true });

    const rate = completedTrainings > 0 ? Math.round((postTrainingHires / completedTrainings) * 1000) / 10 : 0;
    return {
      completedTrainings,
      postTrainingHires,
      trainingToEmploymentRate: rate,
    };
  }

  /**
   * Average Time to Employment and Milestones (3, 6, 12 months)
   */
  async getEmploymentTimeMetrics() {
    const timeStats = await EmploymentRecord.aggregate([
      {
        $group: {
          _id: null,
          averageMonths: { $avg: '$timeToEmploymentMonths' },
          totalEmployed: { $sum: 1 },
          within3Months: {
            $sum: { $cond: [{ $lte: ['$timeToEmploymentMonths', 3] }, 1, 0] },
          },
          within6Months: {
            $sum: { $cond: [{ $lte: ['$timeToEmploymentMonths', 6] }, 1, 0] },
          },
          within12Months: {
            $sum: { $cond: [{ $lte: ['$timeToEmploymentMonths', 12] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          averageTimeToEmployment: { $round: ['$averageMonths', 1] },
          totalEmployed: 1,
          rateWithin3Months: {
            $round: [{ $multiply: [{ $divide: ['$within3Months', { $max: ['$totalEmployed', 1] }] }, 100] }, 1],
          },
          rateWithin6Months: {
            $round: [{ $multiply: [{ $divide: ['$within6Months', { $max: ['$totalEmployed', 1] }] }, 100] }, 1],
          },
          rateWithin12Months: {
            $round: [{ $multiply: [{ $divide: ['$within12Months', { $max: ['$totalEmployed', 1] }] }, 100] }, 1],
          },
        },
      },
    ]);

    return timeStats[0] || {
      averageTimeToEmployment: 0,
      totalEmployed: 0,
      rateWithin3Months: 0,
      rateWithin6Months: 0,
      rateWithin12Months: 0,
    };
  }

  /**
   * Top Employers Hiring Upvia Graduates
   */
  async getTopEmployers(limit = 10) {
    return EmploymentRecord.aggregate([
      {
        $group: {
          _id: '$companyName',
          hiresCount: { $sum: 1 },
          averageSalary: { $avg: '$salary' },
          sectors: { $addToSet: '$sector' },
        },
      },
      { $sort: { hiresCount: -1 } },
      { $limit: limit },
      {
        $project: {
          companyName: '$_id',
          hiresCount: 1,
          averageSalary: { $round: ['$averageSalary', 0] },
          sector: { $arrayElemAt: ['$sectors', 0] },
          _id: 0,
        },
      },
    ]);
  }

  /**
   * Top In-Demand Skills from Active Opportunities & Employment
   */
  async getTopSkills(limit = 10) {
    return Opportunity.aggregate([
      { $match: { status: 'PUBLISHED' } },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.skillNameEn',
          skillId: { $first: '$requiredSkills.skillId' },
          demandCount: { $sum: 1 },
          averageLevelRequired: { $avg: '$requiredSkills.minimumLevel' },
        },
      },
      { $sort: { demandCount: -1 } },
      { $limit: limit },
      {
        $project: {
          skillName: '$_id',
          skillId: 1,
          demandCount: 1,
          averageLevel: { $round: ['$averageLevelRequired', 1] },
          _id: 0,
        },
      },
    ]);
  }

  /**
   * Skill Gaps Across Academic Programs
   */
  async getSkillGaps(programId?: string) {
    const filter = programId ? { programId } : {};
    return SkillGap.find(filter)
      .populate('programId', 'nameEn code')
      .populate('skillId', 'nameEn category')
      .sort({ gapPercentage: -1 })
      .lean();
  }

  /**
   * Program Employability Rankings (Top & Lowest 10 Programs)
   */
  async getProgramEmployabilityRankings() {
    const programs = await Program.find().populate('collegeId', 'nameEn code').lean();
    const rankings = await Graduate.aggregate([
      {
        $group: {
          _id: '$programId',
          totalGraduates: { $sum: 1 },
          employedGraduates: {
            $sum: { $cond: [{ $eq: ['$employmentStatus', 'EMPLOYED'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          programId: '$_id',
          totalGraduates: 1,
          employedGraduates: 1,
          employmentRate: {
            $round: [{ $multiply: [{ $divide: ['$employedGraduates', { $max: ['$totalGraduates', 1] }] }, 100] }, 1],
          },
        },
      },
      { $sort: { employmentRate: -1 } },
    ]);

    const programMap = new Map<string, any>();
    programs.forEach((p) => programMap.set(p._id.toString(), p));

    const enriched = rankings.map((r) => {
      const prog = programMap.get(r.programId.toString());
      return {
        programId: r.programId,
        programName: prog ? prog.nameEn : 'Unknown Program',
        programCode: prog ? prog.code : '---',
        collegeName: prog && prog.collegeId ? (prog.collegeId as any).nameEn : '---',
        targetRate: prog ? prog.targetEmploymentRate : 85,
        currentRate: r.employmentRate,
        totalGraduates: r.totalGraduates,
        employedGraduates: r.employedGraduates,
        variance: r.employmentRate - (prog ? prog.targetEmploymentRate : 85),
      };
    });

    return {
      topPrograms: enriched.slice(0, 10),
      lowestPrograms: enriched.slice(-10).reverse(),
    };
  }

  /**
   * Company Performance Analytics
   */
  async getCompanyPerformance(limit = 10) {
    return Company.find({ isVerified: true })
      .sort({ trainingToEmploymentRate: -1, averageRating: -1 })
      .limit(limit)
      .select('nameEn nameAr sector trainingToEmploymentRate averageRating totalSeatsOffered studentsAccepted studentsTrained studentsEmployed')
      .lean();
  }

  /**
   * Sector Distribution of Employed Graduates
   */
  async getSectorDistribution() {
    return EmploymentRecord.aggregate([
      {
        $group: {
          _id: '$sector',
          count: { $sum: 1 },
          averageSalary: { $avg: '$salary' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          sector: '$_id',
          count: 1,
          averageSalary: { $round: ['$averageSalary', 0] },
          _id: 0,
        },
      },
    ]);
  }
}

export const analyticsService = new AnalyticsService();
