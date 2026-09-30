import { Request, Response, NextFunction } from 'express';
import { TrainingEvaluation, CompanyEvaluation, Training, Company, Student, Opportunity } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.util';
import { UserRole } from '../../shared';
import { ITrainingDocument } from '../training/training.model';
import { TokenPayload } from '../../utils/jwt.util';

const COMPANY_SIDE_ROLES = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.TRAINING_ENTITY_SUPERVISOR];

// A skill acquired verification threshold: a supervisor overall-performance
// score of 3/5 or better on the training corroborates the student's self-reported level.
const SKILL_VERIFICATION_MIN_SCORE = 3;

function assertSupervisorEvaluator(training: ITrainingDocument, user: TokenPayload): 'ACADEMIC_SUPERVISOR' | 'COMPANY_SUPERVISOR' {
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.COOPERATIVE_TRAINING_UNIT || user.role === UserRole.UNIVERSITY_ADMIN) {
    return 'ACADEMIC_SUPERVISOR';
  }
  if (user.role === UserRole.ACADEMIC_SUPERVISOR) {
    if (training.academicSupervisorId && training.academicSupervisorId.toString() === user.userId) {
      return 'ACADEMIC_SUPERVISOR';
    }
    throw new ForbiddenError('You are not the assigned academic supervisor for this training');
  }
  if (COMPANY_SIDE_ROLES.includes(user.role)) {
    if (user.companyId && training.companyId.toString() === user.companyId) {
      return 'COMPANY_SUPERVISOR';
    }
    throw new ForbiddenError('You do not belong to the company hosting this training');
  }
  throw new ForbiddenError('You are not permitted to evaluate this training');
}

async function verifyAcquiredSkills(training: ITrainingDocument): Promise<void> {
  const opportunity = await Opportunity.findById(training.opportunityId).select('requiredSkills').lean();
  if (!opportunity || !opportunity.requiredSkills?.length) return;

  const requiredSkillIds = opportunity.requiredSkills.map((s) => s.skillId.toString());
  const student = await Student.findById(training.studentId);
  if (!student) return;

  let mutated = false;
  student.skills.forEach((skill) => {
    if (!skill.verified && requiredSkillIds.includes(skill.skillId.toString())) {
      skill.verified = true;
      mutated = true;
    }
  });
  if (mutated) await student.save();
}

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
      const evaluatorType = assertSupervisorEvaluator(training, req.user);

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
        { trainingId, evaluatorType },
        {
          trainingId,
          studentId: training.studentId,
          evaluatorId: req.user.userId,
          evaluatorType,
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

      if (averageScore >= SKILL_VERIFICATION_MIN_SCORE) {
        await verifyAcquiredSkills(training);
      }

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

      if (req.user.role === UserRole.STUDENT) {
        const student = await Student.findOne({ userId: req.user.userId });
        if (!student || training.studentId.toString() !== student._id.toString()) {
          throw new ForbiddenError('You may only evaluate your own training placement');
        }
      } else if (req.user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenError('Only the trainee may submit a company evaluation');
      }

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
