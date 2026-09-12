import { Request, Response, NextFunction } from 'express';
import { TrainingEvaluation, CompanyEvaluation, Training, Company } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';

export class EvaluationController {
  async submitSupervisorEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const {
        trainingId,
        technicalSkills,
        communication,
        problemSolving,
        teamwork,
        professionalism,
        attendance,
        qualityOfWork,
        initiative,
        learningAbility,
        overallPerformance,
        feedback,
      } = req.body;

      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training placement not found');

      const scores = [
        technicalSkills,
        communication,
        problemSolving,
        teamwork,
        professionalism,
        attendance,
        qualityOfWork,
        initiative,
        learningAbility,
        overallPerformance,
      ];
      const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

      const evaluation = await TrainingEvaluation.findOneAndUpdate(
        {
          trainingId,
          evaluatorType: req.user.role.includes('COMPANY') ? 'COMPANY_SUPERVISOR' : 'ACADEMIC_SUPERVISOR',
        },
        {
          trainingId,
          studentId: training.studentId,
          evaluatorId: req.user.userId,
          evaluatorType: req.user.role.includes('COMPANY') ? 'COMPANY_SUPERVISOR' : 'ACADEMIC_SUPERVISOR',
          technicalSkills,
          communication,
          problemSolving,
          teamwork,
          professionalism,
          attendance,
          qualityOfWork,
          initiative,
          learningAbility,
          overallPerformance,
          averageScore,
          feedback,
        },
        { upsert: true, new: true }
      );

      sendSuccess(res, evaluation, 'Supervisor evaluation submitted');
    } catch (error) {
      next(error);
    }
  }

  async submitCompanyEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const {
        trainingId,
        trainingQuality,
        tasksRelevance,
        supervisionQuality,
        workEnvironment,
        specializationRelevance,
        learningOpportunities,
        employmentOpportunities,
        comments,
      } = req.body;

      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training placement not found');

      const scores = [
        trainingQuality,
        tasksRelevance,
        supervisionQuality,
        workEnvironment,
        specializationRelevance,
        learningOpportunities,
        employmentOpportunities,
      ];
      const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

      const evaluation = await CompanyEvaluation.findOneAndUpdate(
        { trainingId },
        {
          trainingId,
          studentId: training.studentId,
          companyId: training.companyId,
          trainingQuality,
          tasksRelevance,
          supervisionQuality,
          workEnvironment,
          specializationRelevance,
          learningOpportunities,
          employmentOpportunities,
          averageScore,
          comments,
        },
        { upsert: true, new: true }
      );

      // Recalculate company average rating across all student evaluations
      const allEvaluations = await CompanyEvaluation.find({ companyId: training.companyId });
      const compAvg =
        Math.round((allEvaluations.reduce((acc, curr) => acc + curr.averageScore, 0) / allEvaluations.length) * 10) / 10;
      await Company.findByIdAndUpdate(training.companyId, { averageRating: compAvg });

      sendSuccess(res, evaluation, 'Company evaluation submitted');
    } catch (error) {
      next(error);
    }
  }

  async getTrainingEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const { trainingId } = req.params;
      const [supervisorEvals, studentCompanyEval] = await Promise.all([
        TrainingEvaluation.find({ trainingId }).populate('evaluatorId', 'firstNameEn lastNameEn email').lean(),
        CompanyEvaluation.findOne({ trainingId }).lean(),
      ]);

      sendSuccess(res, {
        supervisorEvaluations: supervisorEvals,
        companyEvaluation: studentCompanyEval,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const evaluationController = new EvaluationController();
