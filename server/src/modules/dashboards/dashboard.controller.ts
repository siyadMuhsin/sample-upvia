import { Request, Response, NextFunction } from 'express';
import {
  Student,
  Company,
  Opportunity,
  Training,
  Application,
  Interview,
  JobOffer,
  Alert,
} from '../../models';
import { analyticsService, AcademicScopeFilter, assertValidScopeFilter } from '../analytics/analytics.service';
import { defaultMatchingProvider } from '../matching/matching.service';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';
import { OpportunityStatus, ApplicationStatus, TrainingStatus, AlertSeverity, UserRole } from '../../shared';

export class DashboardController {
  /**
   * University Leadership Dashboard.
   *
   * Always scoped to the requester's own university; Deans and Program
   * Coordinators can further narrow to their college/department/program via
   * optional query params so they see their own institutional slice rather
   * than the whole platform.
   */
  async getLeadershipDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      // Only a Super Admin may request another institution's scope via query
      // params — every other role is hard-pinned to their own assignment so a
      // Dean/Coordinator can never pull a different institution's KPIs.
      const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
      const scopeFilter: AcademicScopeFilter = {
        universityId: isSuperAdmin ? (req.query.universityId as string) || req.user?.universityId : req.user?.universityId,
        collegeId: isSuperAdmin ? (req.query.collegeId as string | undefined) : req.user?.collegeId,
        departmentId: isSuperAdmin ? (req.query.departmentId as string | undefined) : req.user?.departmentId,
        programId: isSuperAdmin ? (req.query.programId as string | undefined) : req.user?.programId,
      };
      assertValidScopeFilter(scopeFilter);
      const hasScope = !!(scopeFilter.universityId || scopeFilter.collegeId || scopeFilter.departmentId || scopeFilter.programId);

      const studentFilter: Record<string, any> = {};
      if (scopeFilter.universityId) studentFilter.universityId = scopeFilter.universityId;
      if (scopeFilter.collegeId) studentFilter.collegeId = scopeFilter.collegeId;
      if (scopeFilter.departmentId) studentFilter.departmentId = scopeFilter.departmentId;
      if (scopeFilter.programId) studentFilter.programId = scopeFilter.programId;

      const scopedStudentIds = hasScope ? await Student.find(studentFilter).distinct('_id') : undefined;
      const trainingFilter: Record<string, any> = { status: TrainingStatus.IN_TRAINING };
      if (scopedStudentIds) trainingFilter.studentId = { $in: scopedStudentIds };

      const [
        totalStudents,
        totalCompanies,
        publishedOpportunities,
        activeTrainings,
        employmentRate,
        trainingToEmployment,
        topEmployers,
        topSkills,
        programRankings,
        sectorDistribution,
        activeAlerts,
      ] = await Promise.all([
        Student.countDocuments(studentFilter),
        Company.countDocuments({ isVerified: true }),
        Opportunity.countDocuments({ status: OpportunityStatus.PUBLISHED }),
        Training.countDocuments(trainingFilter),
        analyticsService.getEmploymentRate(scopeFilter),
        analyticsService.getTrainingToEmploymentRate(scopeFilter),
        analyticsService.getTopEmployers(5, scopeFilter),
        analyticsService.getTopSkills(6),
        analyticsService.getProgramEmployabilityRankings(scopeFilter),
        analyticsService.getSectorDistribution(scopeFilter),
        Alert.find({ resolved: false }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      sendSuccess(res, {
        scope: scopeFilter,
        kpis: {
          totalStudents,
          totalGraduates: employmentRate.totalGraduates,
          partnerCompanies: totalCompanies,
          activeOpportunities: publishedOpportunities,
          activeTrainees: activeTrainings,
          employmentRate: employmentRate.employmentRate,
          trainingToEmploymentRate: trainingToEmployment.trainingToEmploymentRate,
        },
        employmentRateBreakdown: employmentRate,
        trainingToEmploymentBreakdown: trainingToEmployment,
        topEmployers,
        topSkills,
        programRankings,
        sectorDistribution,
        recentAlerts: activeAlerts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student Personal Employability Dashboard
   */
  async getStudentDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId })
        .populate('programId', 'nameEn code')
        .populate('collegeId', 'nameEn code');

      if (!student) throw new NotFoundError('Student profile not found');

      const [applications, interviews, training, jobOffers, publishedOpportunities] = await Promise.all([
        Application.find({ studentId: student._id })
          .populate('opportunityId', 'titleEn titleAr location type companyId')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Interview.find({ studentId: student._id, status: 'SCHEDULED' })
          .populate('companyId', 'nameEn nameAr logoUrl')
          .sort({ date: 1 })
          .limit(3)
          .lean(),
        Training.findOne({ studentId: student._id })
          .populate('companyId', 'nameEn nameAr logoUrl sector')
          .lean(),
        JobOffer.find({ studentId: student._id, status: 'PENDING' })
          .populate('companyId', 'nameEn nameAr logoUrl')
          .lean(),
        Opportunity.find({ status: OpportunityStatus.PUBLISHED })
          .populate('companyId', 'nameEn nameAr logoUrl sector')
          .limit(6)
          .lean(),
      ]);

      // Calculate matches for recommended opportunities
      const recommendedOpps = await Promise.all(
        publishedOpportunities.map(async (opp) => {
          const match = await defaultMatchingProvider.calculateMatch(student, opp as any);
          return {
            ...opp,
            matchScore: match.score,
            matchExplanation: match.explanation,
            matchedSkillsCount: match.matchedSkills.length,
            requiredSkillsCount: opp.requiredSkills.length,
          };
        })
      );

      recommendedOpps.sort((a, b) => b.matchScore - a.matchScore);

      sendSuccess(res, {
        student: {
          id: student._id,
          studentId: student.studentId,
          specialization: student.specialization,
          gpa: student.gpa,
          maxGpa: student.maxGpa,
          creditsCompleted: student.creditsCompleted,
          expectedGraduationDate: student.expectedGraduationDate,
          profileCompletionScore: student.profileCompletionScore,
          skillsCount: student.skills.length,
          projectsCount: student.projects.length,
        },
        recentApplications: applications,
        upcomingInterviews: interviews,
        activeTraining: training,
        pendingJobOffers: jobOffers,
        recommendedOpportunities: recommendedOpps.slice(0, 4),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Company Employer Dashboard
   */
  async getCompanyDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      if (!companyId) throw new BadRequestError('Company ID required');

      const company = await Company.findById(companyId);
      if (!company) throw new NotFoundError('Company not found');

      const [opportunities, applications, activeTrainees, jobOffers] = await Promise.all([
        Opportunity.find({ companyId }).lean(),
        Application.find()
          .populate({
            path: 'opportunityId',
            match: { companyId },
            select: 'titleEn',
          })
          .populate({
            path: 'studentId',
            populate: { path: 'userId', select: 'firstNameEn lastNameEn email' },
          })
          .sort({ matchScore: -1 })
          .limit(10)
          .lean(),
        Training.find({ companyId, status: TrainingStatus.IN_TRAINING })
          .populate({
            path: 'studentId',
            populate: { path: 'userId', select: 'firstNameEn lastNameEn email avatarUrl' },
          })
          .lean(),
        JobOffer.find({ companyId }).lean(),
      ]);

      const validApplications = applications.filter((a) => a.opportunityId !== null);

      sendSuccess(res, {
        company: {
          id: company._id,
          nameEn: company.nameEn,
          nameAr: company.nameAr,
          sector: company.sector,
          rating: company.averageRating,
          trainingToEmploymentRate: company.trainingToEmploymentRate,
        },
        kpis: {
          totalOpportunities: opportunities.length,
          totalApplications: validApplications.length,
          activeTrainees: activeTrainees.length,
          hiredStudents: company.studentsEmployed || 0,
          trainingToEmploymentRate: company.trainingToEmploymentRate || 0,
        },
        recentApplicants: validApplications.slice(0, 5),
        currentTrainees: activeTrainees,
        jobOffers,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
