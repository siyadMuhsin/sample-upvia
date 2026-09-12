import { Router } from 'express';
import { evaluationController } from './evaluation.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/supervisor', authenticate, (req, res, next) => evaluationController.submitSupervisorEvaluation(req, res, next));
router.post('/company', authenticate, (req, res, next) => evaluationController.submitCompanyEvaluation(req, res, next));
router.get('/training/:trainingId', authenticate, (req, res, next) => evaluationController.getTrainingEvaluations(req, res, next));

export default router;
