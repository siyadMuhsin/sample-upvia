import { Router } from 'express';
import { opportunityController } from './opportunity.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, (req, res, next) => opportunityController.getOpportunities(req, res, next));
router.get('/:id', optionalAuthenticate, (req, res, next) => opportunityController.getOpportunityById(req, res, next));
router.post('/', authenticate, (req, res, next) => opportunityController.createOpportunity(req, res, next));
router.patch('/:id/workflow', authenticate, (req, res, next) => opportunityController.updateWorkflowStatus(req, res, next));

export default router;
