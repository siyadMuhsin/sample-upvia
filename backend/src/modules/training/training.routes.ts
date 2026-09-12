import { Router } from 'express';
import { trainingController } from './training.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/my', authenticate, (req, res, next) => trainingController.getMyTraining(req, res, next));
router.get('/', authenticate, (req, res, next) => trainingController.getTrainings(req, res, next));
router.get('/:id', authenticate, (req, res, next) => trainingController.getTrainingById(req, res, next));
router.post('/attendance', authenticate, (req, res, next) => trainingController.logAttendance(req, res, next));
router.post('/tasks', authenticate, (req, res, next) => trainingController.createTask(req, res, next));
router.patch('/tasks/:taskId', authenticate, (req, res, next) => trainingController.updateTaskStatus(req, res, next));
router.post('/reports', authenticate, (req, res, next) => trainingController.submitReport(req, res, next));
router.patch('/:id/status', authenticate, (req, res, next) => trainingController.updateTrainingStatus(req, res, next));

export default router;
