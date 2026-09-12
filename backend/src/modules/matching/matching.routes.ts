import { Router } from 'express';
import { matchingController } from './matching.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/recommended', authenticate, (req, res, next) => matchingController.getRecommendedOpportunities(req, res, next));
router.get('/:opportunityId', authenticate, (req, res, next) => matchingController.matchOpportunity(req, res, next));

export default router;
