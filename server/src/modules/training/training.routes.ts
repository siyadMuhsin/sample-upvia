import { Router } from 'express';
import { trainingController } from './training.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStudent, requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

// Broad "can touch training records at all" gate; the controller further
// restricts mutation to the specific training's assigned supervisor/company
// (or COOPERATIVE_TRAINING_UNIT / UNIVERSITY_ADMIN as an override).
const requireTrainingActor = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.TRAINING_ENTITY_SUPERVISOR,
  UserRole.ACADEMIC_SUPERVISOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

// Reports are self-authored by the trainee (weekly/final logs); staff may also file them.
const requireReportSubmitter = requireRoles(
  UserRole.STUDENT,
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.TRAINING_ENTITY_SUPERVISOR,
  UserRole.ACADEMIC_SUPERVISOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN
);

const requireTrainingViewer = requireRoles(
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.TRAINING_ENTITY_SUPERVISOR,
  UserRole.ACADEMIC_SUPERVISOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN,
  UserRole.PROGRAM_COORDINATOR,
  UserRole.COLLEGE_DEAN,
  UserRole.COLLEGE_VICE_DEAN
);

router.get('/my', authenticate, requireStudent, (req, res, next) => trainingController.getMyTraining(req, res, next));
router.get('/', authenticate, requireTrainingViewer, (req, res, next) => trainingController.getTrainings(req, res, next));
router.get('/:id', authenticate, (req, res, next) => trainingController.getTrainingById(req, res, next));
router.post('/attendance', authenticate, requireTrainingActor, (req, res, next) => trainingController.logAttendance(req, res, next));
router.post('/tasks', authenticate, requireTrainingActor, (req, res, next) => trainingController.createTask(req, res, next));
router.patch('/tasks/:taskId', authenticate, requireTrainingActor, (req, res, next) => trainingController.updateTaskStatus(req, res, next));
router.post('/reports', authenticate, requireReportSubmitter, (req, res, next) => trainingController.submitReport(req, res, next));
router.patch('/:trainingId/reports/:reportId/review', authenticate, requireTrainingActor, (req, res, next) =>
  trainingController.reviewReport(req, res, next)
);
router.patch('/:id/status', authenticate, requireTrainingActor, (req, res, next) => trainingController.updateTrainingStatus(req, res, next));

export default router;
