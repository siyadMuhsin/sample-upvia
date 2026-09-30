import { Router } from 'express';
import { universityProvisionController } from './university-provision.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRoles(UserRole.SUPER_ADMIN),
  (req, res, next) => universityProvisionController.provisionUniversity(req, res, next)
);

router.get(
  '/',
  authenticate,
  requireRoles(UserRole.SUPER_ADMIN),
  (req, res, next) => universityProvisionController.getUniversities(req, res, next)
);

export default router;
