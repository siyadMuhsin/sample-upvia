import { Router } from 'express';
import { studentController } from './student.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/me', authenticate, (req, res, next) => studentController.getMyProfile(req, res, next));
router.put('/me', authenticate, (req, res, next) => studentController.updateMyProfile(req, res, next));
router.get('/', authenticate, requireAcademicStaff, (req, res, next) => studentController.getStudents(req, res, next));
router.get('/:id', authenticate, (req, res, next) => studentController.getStudentById(req, res, next));

export default router;
