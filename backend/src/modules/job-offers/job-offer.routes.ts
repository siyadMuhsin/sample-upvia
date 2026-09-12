import { Router } from 'express';
import { jobOfferController } from './job-offer.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, (req, res, next) => jobOfferController.createJobOffer(req, res, next));
router.get('/my', authenticate, (req, res, next) => jobOfferController.getMyOffers(req, res, next));
router.patch('/:id/respond', authenticate, (req, res, next) => jobOfferController.respondToOffer(req, res, next));

export default router;
