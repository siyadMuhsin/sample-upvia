import { Router } from 'express';
import { skillController } from './skill.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', (req, res, next) => skillController.getSkills(req, res, next));
router.post('/', authenticate, requireAcademicStaff, (req, res, next) => skillController.createSkill(req, res, next));

export default router;
