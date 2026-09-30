import { Router } from 'express';
import { earlyWarningController } from './early-warning.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAcademicStaff } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, (req, res, next) => earlyWarningController.getAlerts(req, res, next));
router.post('/evaluate', authenticate, requireAcademicStaff, (req, res, next) =>
  earlyWarningController.runRuleEvaluation(req, res, next)
);
router.patch('/:id/resolve', authenticate, requireAcademicStaff, (req, res, next) =>
  earlyWarningController.resolveAlert(req, res, next)
);
router.get('/rules', authenticate, requireAcademicStaff, (req, res, next) =>
  earlyWarningController.getRules(req, res, next)
);

export default router;
