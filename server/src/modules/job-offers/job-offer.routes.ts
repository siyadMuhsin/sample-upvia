import { Router } from 'express';
import { jobOfferController } from './job-offer.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStudent, requireRoles } from '../../middleware/rbac.middleware';
import { UserRole } from '../../shared';

const router = Router();

const requireOfferIssuer = requireRoles(UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.UNIVERSITY_ADMIN);

router.post('/', authenticate, requireOfferIssuer, (req, res, next) => jobOfferController.createJobOffer(req, res, next));
router.get('/my', authenticate, requireStudent, (req, res, next) => jobOfferController.getMyOffers(req, res, next));
router.patch('/:id/respond', authenticate, requireStudent, (req, res, next) => jobOfferController.respondToOffer(req, res, next));

export default router;
