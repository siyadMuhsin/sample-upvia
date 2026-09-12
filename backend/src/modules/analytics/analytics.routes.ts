import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/overview', authenticate, (req, res, next) => analyticsController.getEmploymentOverview(req, res, next));
router.get('/top-employers', authenticate, (req, res, next) => analyticsController.getTopEmployers(req, res, next));
router.get('/top-skills', authenticate, (req, res, next) => analyticsController.getTopSkills(req, res, next));
router.get('/skill-gaps', authenticate, (req, res, next) => analyticsController.getSkillGaps(req, res, next));
router.get('/program-rankings', authenticate, (req, res, next) => analyticsController.getProgramRankings(req, res, next));
router.get('/company-performance', authenticate, (req, res, next) => analyticsController.getCompanyPerformance(req, res, next));

export default router;
