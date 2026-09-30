import { Router } from 'express';
import { interviewController } from './interview.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStudent, requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

const requireInterviewManager = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

router.post('/', authenticate, requireInterviewManager, (req, res, next) =>
  interviewController.scheduleInterview(req, res, next)
);
router.get('/my', authenticate, requireStudent, (req, res, next) =>
  interviewController.getMyInterviews(req, res, next)
);
router.get('/', authenticate, requireInterviewManager, (req, res, next) =>
  interviewController.getInterviews(req, res, next)
);
router.get('/:id', authenticate, (req, res, next) => interviewController.getInterviewById(req, res, next));
router.patch('/:id/status', authenticate, requireInterviewManager, (req, res, next) =>
  interviewController.updateInterviewStatus(req, res, next)
);
router.patch('/:id/result', authenticate, requireInterviewManager, (req, res, next) =>
  interviewController.submitResult(req, res, next)
);

export default router;
