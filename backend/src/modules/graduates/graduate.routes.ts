import { Router } from 'express';
import { graduateController } from './graduate.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requireAcademicStaff, (req, res, next) => graduateController.getGraduates(req, res, next));
router.get('/employment-records', authenticate, requireAcademicStaff, (req, res, next) => graduateController.getEmploymentRecords(req, res, next));
router.get('/:graduateId/follow-ups', authenticate, (req, res, next) => graduateController.getGraduateFollowUps(req, res, next));
router.post('/follow-ups', authenticate, (req, res, next) => graduateController.submitFollowUp(req, res, next));

export default router;
