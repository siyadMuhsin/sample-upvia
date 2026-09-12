import { Router } from 'express';
import { studyPlanController } from './study-plan.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', (req, res, next) => studyPlanController.getStudyPlans(req, res, next));
router.get('/:id', (req, res, next) => studyPlanController.getStudyPlanById(req, res, next));
router.post('/', authenticate, requireAcademicStaff, (req, res, next) => studyPlanController.createStudyPlan(req, res, next));
router.patch('/:id/publish', authenticate, requireAcademicStaff, (req, res, next) => studyPlanController.togglePublish(req, res, next));

export default router;
