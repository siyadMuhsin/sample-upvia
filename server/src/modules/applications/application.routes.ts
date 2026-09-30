import { Router } from 'express';
import { applicationController } from './application.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStudent, requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

const requireApplicationReviewer = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.PROGRAM_COORDINATOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

// Status updates are further restricted (ownership, legal transitions, per-role
// target states) inside the controller; students may reach this to WITHDRAW only.
const requireStatusUpdater = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.PROGRAM_COORDINATOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN,
  UserRole.STUDENT
);

router.post('/', authenticate, requireStudent, (req, res, next) => applicationController.apply(req, res, next));
router.get('/my', authenticate, requireStudent, (req, res, next) => applicationController.getMyApplications(req, res, next));
router.get('/company', authenticate, requireApplicationReviewer, (req, res, next) =>
  applicationController.getCompanyApplications(req, res, next)
);
router.patch('/:id/status', authenticate, requireStatusUpdater, (req, res, next) =>
  applicationController.updateStatus(req, res, next)
);

export default router;
