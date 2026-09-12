import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireUniversityAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/leadership', authenticate, requireUniversityAdmin, (req, res, next) =>
  dashboardController.getLeadershipDashboard(req, res, next)
);
router.get('/student', authenticate, (req, res, next) =>
  dashboardController.getStudentDashboard(req, res, next)
);
router.get('/company', authenticate, (req, res, next) =>
  dashboardController.getCompanyDashboard(req, res, next)
);

export default router;
