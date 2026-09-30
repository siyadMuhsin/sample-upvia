import { Router } from 'express';
import { universityController } from './university.controller';

const router = Router();

router.get('/universities', (req, res, next) => universityController.getUniversities(req, res, next));
router.get('/colleges', (req, res, next) => universityController.getColleges(req, res, next));
router.get('/departments', (req, res, next) => universityController.getDepartments(req, res, next));
router.get('/programs', (req, res, next) => universityController.getPrograms(req, res, next));
router.get('/programs/:id', (req, res, next) => universityController.getProgramById(req, res, next));
router.get('/batches', (req, res, next) => universityController.getBatches(req, res, next));

export default router;
