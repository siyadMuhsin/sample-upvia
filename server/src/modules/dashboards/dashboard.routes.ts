import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

// Broad academic-staff gate: Deans/Vice Deans/Coordinators are expected to
// hit this endpoint too, scoped down to their own college/department/program
// via query params (see getLeadershipDashboard) rather than being locked out entirely.
router.get('/leadership', authenticate, requireAcademicStaff, (req, res, next) =>
  dashboardController.getLeadershipDashboard(req, res, next)
);
router.get('/student', authenticate, (req, res, next) =>
  dashboardController.getStudentDashboard(req, res, next)
);
router.get('/company', authenticate, (req, res, next) =>
  dashboardController.getCompanyDashboard(req, res, next)
);

export default router;
