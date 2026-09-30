import { Request, Response, NextFunction } from 'express';
import { analyticsService, AcademicScopeFilter, assertValidScopeFilter } from './analytics.service';
import { skillGapService } from '../skill-gap/skill-gap.service';
import { sendSuccess } from '../../utils/response.util';

/**
 * Builds the hierarchical scope filter (university -> college -> department
 * -> program) from query params, defaulting universityId to the requester's
 * own university so a Dean/Coordinator can narrow further (collegeId/
 * departmentId/programId) but never see another university's data.
 */
function extractScopeFilter(req: Request): AcademicScopeFilter {
  const filter: AcademicScopeFilter = {
    universityId: (req.query.universityId as string) || req.user?.universityId,
    collegeId: req.query.collegeId as string | undefined,
    departmentId: req.query.departmentId as string | undefined,
    programId: req.query.programId as string | undefined,
  };
  assertValidScopeFilter(filter);
  return filter;
}

export class AnalyticsController {
  async getEmploymentOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = extractScopeFilter(req);
      const [employmentRate, trainingToEmployment, timeMetrics, sectorDist] = await Promise.all([
        analyticsService.getEmploymentRate(filter),
        analyticsService.getTrainingToEmploymentRate(filter),
        analyticsService.getEmploymentTimeMetrics(),
        analyticsService.getSectorDistribution(filter),
      ]);

      sendSuccess(res, {
        employmentRate,
        trainingToEmployment,
        timeMetrics,
        sectorDistribution: sectorDist,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopEmployers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const employers = await analyticsService.getTopEmployers(limit, extractScopeFilter(req));
      sendSuccess(res, employers);
    } catch (error) {
      next(error);
    }
  }

  async getTopSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const skills = await analyticsService.getTopSkills(limit);
      sendSuccess(res, skills);
    } catch (error) {
      next(error);
    }
  }

  async getSkillGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const programId = req.query.programId as string;
      const gaps = await analyticsService.getSkillGaps(programId);
      sendSuccess(res, gaps);
    } catch (error) {
      next(error);
    }
  }

  async refreshSkillGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await skillGapService.refreshSkillGaps();
      sendSuccess(res, result, `Skill-gap analysis recomputed: ${result.upserted} program/skill pairs updated`);
    } catch (error) {
      next(error);
    }
  }

  async getProgramRankings(req: Request, res: Response, next: NextFunction) {
    try {
      const rankings = await analyticsService.getProgramEmployabilityRankings(extractScopeFilter(req));
      sendSuccess(res, rankings);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const performance = await analyticsService.getCompanyPerformance();
      sendSuccess(res, performance);
    } catch (error) {
      next(error);
    }
  }

  async getPublicSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await analyticsService.getPublicSummary();
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
