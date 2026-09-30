import { Router } from 'express';
import { evaluationController } from './evaluation.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStudent, requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

const requireSupervisorEvaluator = requireRoles(
  UserRole.ACADEMIC_SUPERVISOR,
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.TRAINING_ENTITY_SUPERVISOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

router.post('/supervisor', authenticate, requireSupervisorEvaluator, (req, res, next) =>
  evaluationController.submitSupervisorEvaluation(req, res, next)
);
router.post('/company', authenticate, requireStudent, (req, res, next) =>
  evaluationController.submitCompanyEvaluation(req, res, next)
);
router.get('/training/:trainingId', authenticate, (req, res, next) => evaluationController.getTrainingEvaluations(req, res, next));

export default router;
