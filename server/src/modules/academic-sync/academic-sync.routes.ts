import { Router } from 'express';
import { academicSyncController } from './academic-sync.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireUniversityAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.post('/sync', authenticate, requireUniversityAdmin, (req, res, next) =>
  academicSyncController.triggerSync(req, res, next)
);
router.get('/logs', authenticate, requireUniversityAdmin, (req, res, next) =>
  academicSyncController.getSyncLogs(req, res, next)
);

export default router;
