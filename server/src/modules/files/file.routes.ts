import { Router } from 'express';
import { fileController } from './file.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/upload-url', authenticate, (req, res, next) => fileController.getUploadUrl(req, res, next));
router.get('/download/:id', authenticate, (req, res, next) => fileController.getDownloadUrl(req, res, next));

export default router;
