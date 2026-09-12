import { Router } from 'express';
import { applicationController } from './application.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, (req, res, next) => applicationController.apply(req, res, next));
router.get('/my', authenticate, (req, res, next) => applicationController.getMyApplications(req, res, next));
router.get('/company', authenticate, (req, res, next) => applicationController.getCompanyApplications(req, res, next));
router.patch('/:id/status', authenticate, (req, res, next) => applicationController.updateStatus(req, res, next));

export default router;
