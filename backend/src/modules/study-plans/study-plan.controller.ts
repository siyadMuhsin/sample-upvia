import { Request, Response, NextFunction } from 'express';
import { StudyPlan } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError } from '../../utils/errors.util';

export class StudyPlanController {
  async getStudyPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { programId } = req.query;
      const filter = programId ? { programId } : {};
      const plans = await StudyPlan.find(filter)
        .populate('programId', 'nameEn nameAr code')
        .populate('courses.courseId', 'courseCode nameEn credits skills')
        .lean();
      sendSuccess(res, plans);
    } catch (error) {
      next(error);
    }
  }

  async getStudyPlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await StudyPlan.findById(req.params.id)
        .populate('programId')
        .populate({
          path: 'courses.courseId',
          populate: { path: 'skills.skillId' },
        })
        .lean();
      if (!plan) throw new NotFoundError('Study plan not found');
      sendSuccess(res, plan);
    } catch (error) {
      next(error);
    }
  }

  async createStudyPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await StudyPlan.create(req.body);
      sendSuccess(res, plan, 'Study plan created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async togglePublish(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await StudyPlan.findById(req.params.id);
      if (!plan) throw new NotFoundError('Study plan not found');
      plan.isPublished = !plan.isPublished;
      await plan.save();
      sendSuccess(res, plan, `Study plan ${plan.isPublished ? 'published' : 'archived'} successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export const studyPlanController = new StudyPlanController();
