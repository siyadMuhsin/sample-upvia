import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.post('/generate', authenticate, requireAcademicStaff, (req, res, next) =>
  reportController.generateReport(req, res, next)
);
router.get('/history', authenticate, requireAcademicStaff, (req, res, next) =>
  reportController.getRecentReports(req, res, next)
);

export default router;
