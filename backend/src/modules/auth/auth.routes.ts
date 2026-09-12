import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));

export default router;
