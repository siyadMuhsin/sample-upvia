import { Router } from 'express';
import { opportunityController } from './opportunity.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

const requireOpportunityCreator = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

// Fine-grained per-target-status role checks happen inside the controller via
// assertRoleCanTransition; this route-level guard only excludes roles that can
// never legally move an opportunity through any step of its workflow.
const requireWorkflowActor = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.PROGRAM_COORDINATOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

router.get('/', optionalAuthenticate, (req, res, next) => opportunityController.getOpportunities(req, res, next));
router.get('/:id', optionalAuthenticate, (req, res, next) => opportunityController.getOpportunityById(req, res, next));
router.post('/', authenticate, requireOpportunityCreator, (req, res, next) =>
  opportunityController.createOpportunity(req, res, next)
);
router.patch('/:id/workflow', authenticate, requireWorkflowActor, (req, res, next) =>
  opportunityController.updateWorkflowStatus(req, res, next)
);

export default router;
