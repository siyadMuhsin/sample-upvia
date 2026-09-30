import mongoose from 'mongoose';
import { Graduate, EmploymentRecord, Training, Company, Opportunity, SkillGap, Student, Program } from '../../models';
import { BadRequestError } from '../../utils/errors.util';

export interface AcademicScopeFilter {
  universityId?: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
}

/**
 * Rejects a scope filter with a clean 400 if any provided id isn't a valid
 * ObjectId, instead of letting an invalid query param fall through to an
 * unhandled Mongoose CastError (500) deep inside an aggregation.
 */
export function assertValidScopeFilter(filter: AcademicScopeFilter): void {
  const invalidKeys = Object.entries(filter)
    .filter(([, value]) => value !== undefined && !mongoose.isValidObjectId(value))
    .map(([key]) => key);

  if (invalidKeys.length > 0) {
    throw new BadRequestError(`Invalid id value provided for: ${invalidKeys.join(', ')}`);
  }
}

export class AnalyticsService {
  /**
   * `Graduate` and `EmploymentRecord` carry universityId/collegeId/programId
   * directly but have no departmentId field of their own — a departmentId
   * scope is resolved to the set of programs under that department instead
   * (Program is the one collection that does carry departmentId natively).
   */
  private async buildAcademicMatch(filter: AcademicScopeFilter): Promise<Record<string, any>> {
    const match: Record<string, any> = {};
    if (filter.universityId) match.universityId = filter.universityId;
    if (filter.collegeId) match.collegeId = filter.collegeId;

    if (filter.programId) {
      match.programId = filter.programId;
    } else if (filter.departmentId) {
      const programIds = await Program.find({ departmentId: filter.departmentId }).distinct('_id');
      match.programId = { $in: programIds };
    }

    return match;
  }

  /**
   * `Training` carries no academic-hierarchy fields at all — scoping it
   * requires resolving the matching Student ids first (Student carries
   * universityId/collegeId/departmentId/programId natively).
   */
  private async resolveScopedStudentIds(filter: AcademicScopeFilter): Promise<mongoose.Types.ObjectId[] | undefined> {
    const hasScope = !!(filter.universityId || filter.collegeId || filter.departmentId || filter.programId);
    if (!hasScope) return undefined;

    const studentFilter: Record<string, any> = {};
    if (filter.universityId) studentFilter.universityId = filter.universityId;
    if (filter.collegeId) studentFilter.collegeId = filter.collegeId;
    if (filter.departmentId) studentFilter.departmentId = filter.departmentId;
    if (filter.programId) studentFilter.programId = filter.programId;

    return Student.find(studentFilter).distinct('_id');
  }

  /**
   * Overall University Employment Rate
   */
  async getEmploymentRate(filter: AcademicScopeFilter = {}) {
    const matchFilter = await this.buildAcademicMatch(filter);

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
  async getTrainingToEmploymentRate(filter: AcademicScopeFilter = {}) {
    const scopedStudentIds = await this.resolveScopedStudentIds(filter);

    const trainingFilter: Record<string, any> = { status: 'COMPLETED' };
    const employmentFilter: Record<string, any> = { isPostTrainingHire: true };
    if (scopedStudentIds) {
      trainingFilter.studentId = { $in: scopedStudentIds };
      employmentFilter.studentId = { $in: scopedStudentIds };
    }

    const completedTrainings = await Training.countDocuments(trainingFilter);
    const postTrainingHires = await EmploymentRecord.countDocuments(employmentFilter);

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
  async getTopEmployers(limit = 10, filter: AcademicScopeFilter = {}) {
    const matchFilter = await this.buildAcademicMatch(filter);
    return EmploymentRecord.aggregate([
      { $match: matchFilter },
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
  async getProgramEmployabilityRankings(filter: AcademicScopeFilter = {}) {
    const programFilter: Record<string, any> = {};
    if (filter.collegeId) programFilter.collegeId = filter.collegeId;
    if (filter.departmentId) programFilter.departmentId = filter.departmentId;
    if (filter.programId) programFilter._id = filter.programId;

    const programs = await Program.find(programFilter).populate('collegeId', 'nameEn code').lean();
    const matchFilter = await this.buildAcademicMatch(filter);

    const rankings = await Graduate.aggregate([
      { $match: matchFilter },
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
  /**
   * Unauthenticated, platform-wide headline stats for the public marketing
   * landing page. No academic scope filter — always computed across every
   * university, so it must never be exposed via an authenticated/scoped route.
   */
  async getPublicSummary() {
    const [employmentRate, trainingToEmployment, partnerCompaniesCount, hoursAgg] = await Promise.all([
      this.getEmploymentRate(),
      this.getTrainingToEmploymentRate(),
      Company.countDocuments(),
      Training.aggregate([{ $group: { _id: null, totalHours: { $sum: '$totalHoursCompleted' } } }]),
    ]);

    return {
      employmentRate: employmentRate.employmentRate,
      trainingToEmploymentRate: trainingToEmployment.trainingToEmploymentRate,
      partnerCompaniesCount,
      totalTrainingHours: hoursAgg[0]?.totalHours || 0,
    };
  }

  async getSectorDistribution(filter: AcademicScopeFilter = {}) {
    const matchFilter = await this.buildAcademicMatch(filter);
    return EmploymentRecord.aggregate([
      { $match: matchFilter },
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
