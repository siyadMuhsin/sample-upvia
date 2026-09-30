import { Router } from 'express';
import { studentProvisionController } from './student-provision.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles, requireUniversityAdmin } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

router.post(
  '/bulk-import',
  authenticate,
  requireRoles(UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN),
  (req, res, next) => studentProvisionController.bulkImportStudents(req, res, next)
);

router.patch(
  '/:id/academic-override',
  authenticate,
  requireUniversityAdmin,
  (req, res, next) => studentProvisionController.academicOverride(req, res, next)
);

export default router;
