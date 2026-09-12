import { Request, Response, NextFunction } from 'express';
import {
  Student,
  Company,
  Opportunity,
  Training,
  Application,
  Interview,
  JobOffer,
  Graduate,
  Alert,
  Program,
} from '../../models';
import { analyticsService } from '../analytics/analytics.service';
import { defaultMatchingProvider } from '../matching/matching.service';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';
import { OpportunityStatus, ApplicationStatus, TrainingStatus, AlertSeverity } from '@upvia/shared';

export class DashboardController {
  /**
   * University Leadership Dashboard
   */
  async getLeadershipDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalStudents,
        totalGraduates,
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
        Student.countDocuments(),
        Graduate.countDocuments(),
        Company.countDocuments({ isVerified: true }),
        Opportunity.countDocuments({ status: OpportunityStatus.PUBLISHED }),
        Training.countDocuments({ status: TrainingStatus.IN_TRAINING }),
        analyticsService.getEmploymentRate(),
        analyticsService.getTrainingToEmploymentRate(),
        analyticsService.getTopEmployers(5),
        analyticsService.getTopSkills(6),
        analyticsService.getProgramEmployabilityRankings(),
        analyticsService.getSectorDistribution(),
        Alert.find({ resolved: false }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      sendSuccess(res, {
        kpis: {
          totalStudents,
          totalGraduates,
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
