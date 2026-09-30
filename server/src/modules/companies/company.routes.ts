import { Router } from 'express';
import { companyController } from './company.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff, requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

// Companies may self-register/update; the training unit or a university admin
// may also create/edit on a company's behalf (e.g. manual onboarding).
const requireCompanyOwnerOrStaff = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

router.get('/', (req, res, next) => companyController.getCompanies(req, res, next));
router.get('/:id', (req, res, next) => companyController.getCompanyById(req, res, next));
router.post('/', authenticate, requireCompanyOwnerOrStaff, (req, res, next) =>
  companyController.createCompany(req, res, next)
);
router.put('/:id', authenticate, requireCompanyOwnerOrStaff, (req, res, next) =>
  companyController.updateCompany(req, res, next)
);
router.patch(
  '/:id/partnership-decision',
  authenticate,
  requireAcademicStaff,
  (req, res, next) => companyController.updatePartnershipDecision(req, res, next)
);

export default router;
