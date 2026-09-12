import { Router } from 'express';
import { companyController } from './company.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireCompanyStaff, requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', (req, res, next) => companyController.getCompanies(req, res, next));
router.get('/:id', (req, res, next) => companyController.getCompanyById(req, res, next));
router.post('/', authenticate, (req, res, next) => companyController.createCompany(req, res, next));
router.put('/:id', authenticate, (req, res, next) => companyController.updateCompany(req, res, next));

export default router;
