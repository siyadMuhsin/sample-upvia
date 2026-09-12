import { Request, Response, NextFunction } from 'express';
import { Course } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';

export class CourseController {
  async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, search } = req.query;
      const filter: any = {};
      if (departmentId) filter.departmentId = departmentId;
      if (search) {
        filter.$or = [
          { courseCode: { $regex: search, $options: 'i' } },
          { nameEn: { $regex: search, $options: 'i' } },
        ];
      }
      const courses = await Course.find(filter)
        .populate('departmentId', 'nameEn code')
        .populate('skills.skillId', 'nameEn category')
        .sort({ courseCode: 1 })
        .lean();
      sendSuccess(res, courses);
    } catch (error) {
      next(error);
    }
  }

  async getCourseById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await Course.findById(req.params.id)
        .populate('departmentId')
        .populate('skills.skillId')
        .lean();
      if (!course) throw new NotFoundError('Course not found');
      sendSuccess(res, course);
    } catch (error) {
      next(error);
    }
  }

  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await Course.create(req.body);
      sendSuccess(res, course, 'Course created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const courseController = new CourseController();
