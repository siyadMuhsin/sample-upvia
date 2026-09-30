import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

// Public, unauthenticated, platform-wide headline stats for the marketing landing page.
router.get('/public-summary', (req, res, next) => analyticsController.getPublicSummary(req, res, next));

router.get('/overview', authenticate, (req, res, next) => analyticsController.getEmploymentOverview(req, res, next));
router.get('/top-employers', authenticate, (req, res, next) => analyticsController.getTopEmployers(req, res, next));
router.get('/top-skills', authenticate, (req, res, next) => analyticsController.getTopSkills(req, res, next));
router.get('/skill-gaps', authenticate, (req, res, next) => analyticsController.getSkillGaps(req, res, next));
router.post('/skill-gaps/refresh', authenticate, requireAcademicStaff, (req, res, next) =>
  analyticsController.refreshSkillGaps(req, res, next)
);
router.get('/program-rankings', authenticate, (req, res, next) => analyticsController.getProgramRankings(req, res, next));
router.get('/company-performance', authenticate, (req, res, next) => analyticsController.getCompanyPerformance(req, res, next));

export default router;
