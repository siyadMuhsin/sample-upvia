import { Request, Response, NextFunction } from 'express';
import { University, College, Department, Program, Batch } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError } from '../../utils/errors.util';

export class UniversityController {
  async getUniversities(req: Request, res: Response, next: NextFunction) {
    try {
      const universities = await University.find().lean();
      sendSuccess(res, universities);
    } catch (error) {
      next(error);
    }
  }

  async getColleges(req: Request, res: Response, next: NextFunction) {
    try {
      const { universityId } = req.query;
      const filter = universityId ? { universityId } : {};
      const colleges = await College.find(filter).lean();
      sendSuccess(res, colleges);
    } catch (error) {
      next(error);
    }
  }

  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const { collegeId } = req.query;
      const filter = collegeId ? { collegeId } : {};
      const departments = await Department.find(filter).lean();
      sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  async getPrograms(req: Request, res: Response, next: NextFunction) {
    try {
      const { collegeId, departmentId } = req.query;
      const filter: any = {};
      if (collegeId) filter.collegeId = collegeId;
      if (departmentId) filter.departmentId = departmentId;
      const programs = await Program.find(filter).populate('collegeId', 'nameEn nameAr').lean();
      sendSuccess(res, programs);
    } catch (error) {
      next(error);
    }
  }

  async getProgramById(req: Request, res: Response, next: NextFunction) {
    try {
      const program = await Program.findById(req.params.id)
        .populate('collegeId')
        .populate('departmentId')
        .lean();
      if (!program) throw new NotFoundError('Program not found');
      sendSuccess(res, program);
    } catch (error) {
      next(error);
    }
  }

  async getBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const batches = await Batch.find().sort({ year: -1 }).lean();
      sendSuccess(res, batches);
    } catch (error) {
      next(error);
    }
  }
}

export const universityController = new UniversityController();
