import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireUniversityAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requireUniversityAdmin, (req, res, next) =>
  auditController.getAuditLogs(req, res, next)
);

export default router;
