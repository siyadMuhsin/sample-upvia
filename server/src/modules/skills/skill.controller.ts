import { Request, Response, NextFunction } from 'express';
import { Skill } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { BadRequestError } from '../../utils/errors.util';

export class SkillController {
  async getSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search } = req.query;
      const filter: any = {};
      if (category) filter.category = category;
      if (search) {
        filter.$or = [
          { nameEn: { $regex: search, $options: 'i' } },
          { nameAr: { $regex: search, $options: 'i' } },
        ];
      }
      const skills = await Skill.find(filter).sort({ nameEn: 1 }).lean();
      sendSuccess(res, skills);
    } catch (error) {
      next(error);
    }
  }

  async createSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { nameEn, nameAr, category, description, levels } = req.body;
      if (!nameEn || !nameAr || !category) {
        throw new BadRequestError('nameEn, nameAr, and category are required');
      }
      const skill = await Skill.create({ nameEn, nameAr, category, description, levels });
      sendSuccess(res, skill, 'Skill created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const skillController = new SkillController();
