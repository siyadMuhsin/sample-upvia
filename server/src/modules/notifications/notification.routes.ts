import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/my', authenticate, (req, res, next) => notificationController.getMyNotifications(req, res, next));
router.patch('/:id/read', authenticate, (req, res, next) => notificationController.markAsRead(req, res, next));
router.post('/read-all', authenticate, (req, res, next) => notificationController.markAllAsRead(req, res, next));

export default router;
