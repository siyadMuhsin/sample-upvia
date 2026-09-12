import { Request, Response, NextFunction } from 'express';
import { Student, Opportunity, MatchResult } from '../../models';
import { defaultMatchingProvider } from './matching.service';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';
import { OpportunityStatus } from '@upvia/shared';

export class MatchingController {
  async matchOpportunity(req: Request, res: Response, next: NextFunction) {
    try {
      const { opportunityId } = req.params;
      let studentId = req.query.studentId as string;

      if (!studentId && req.user) {
        const student = await Student.findOne({ userId: req.user.userId });
        if (student) studentId = student._id.toString();
      }

      if (!studentId) throw new BadRequestError('studentId is required');

      const student = await Student.findById(studentId);
      if (!student) throw new NotFoundError('Student profile not found');

      const opportunity = await Opportunity.findById(opportunityId);
      if (!opportunity) throw new NotFoundError('Opportunity not found');

      const result = await defaultMatchingProvider.calculateMatch(student, opportunity);

      // Cache or upsert in MatchResult
      await MatchResult.findOneAndUpdate(
        { studentId: student._id, opportunityId: opportunity._id },
        {
          score: result.score,
          breakdown: result.breakdown,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          matchedCourses: result.matchedCourses,
          recommendedCourses: result.recommendedCourses,
          eligibility: result.eligibility,
          explanation: result.explanation,
        },
        { upsert: true, new: true }
      );

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRecommendedOpportunities(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      const opportunities = await Opportunity.find({ status: OpportunityStatus.PUBLISHED })
        .populate('companyId', 'nameEn nameAr logoUrl sector averageRating cities')
        .lean();

      const ranked = await Promise.all(
        opportunities.map(async (opp) => {
          const match = await defaultMatchingProvider.calculateMatch(student, opp as any);
          return {
            ...opp,
            matchScore: match.score,
            matchDetails: match,
          };
        })
      );

      ranked.sort((a, b) => b.matchScore - a.matchScore);
      sendSuccess(res, ranked.slice(0, 10));
    } catch (error) {
      next(error);
    }
  }
}

export const matchingController = new MatchingController();
