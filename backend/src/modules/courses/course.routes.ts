import { Router } from 'express';
import { courseController } from './course.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', (req, res, next) => courseController.getCourses(req, res, next));
router.get('/:id', (req, res, next) => courseController.getCourseById(req, res, next));
router.post('/', authenticate, requireAcademicStaff, (req, res, next) => courseController.createCourse(req, res, next));

export default router;
