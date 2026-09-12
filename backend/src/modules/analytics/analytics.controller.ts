import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response.util';

export class AnalyticsController {
  async getEmploymentOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const [employmentRate, trainingToEmployment, timeMetrics, sectorDist] = await Promise.all([
        analyticsService.getEmploymentRate(),
        analyticsService.getTrainingToEmploymentRate(),
        analyticsService.getEmploymentTimeMetrics(),
        analyticsService.getSectorDistribution(),
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
      const employers = await analyticsService.getTopEmployers(limit);
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

  async getProgramRankings(req: Request, res: Response, next: NextFunction) {
    try {
      const rankings = await analyticsService.getProgramEmployabilityRankings();
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
}

export const analyticsController = new AnalyticsController();
