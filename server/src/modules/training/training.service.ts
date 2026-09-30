import mongoose from 'mongoose';
import { Training, Opportunity, Company } from '../../models';
import { ITrainingDocument } from './training.model';
import { TrainingStatus } from '../../shared';
import { NotFoundError } from '../../utils/errors.util';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Provisions the Training placement that the spec's "Nomination" step requires.
 * Idempotent: if a Training already exists for this student+opportunity pair
 * (e.g. re-entrant webhook or duplicate status update), it is returned as-is.
 *
 * Also increments Company.studentsAccepted, since this is the moment a student
 * is formally accepted into a company's training pipeline.
 */
export async function ensureTrainingForApplication(params: {
  studentId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
}): Promise<{ training: ITrainingDocument; created: boolean }> {
  const existing = await Training.findOne({
    studentId: params.studentId,
    opportunityId: params.opportunityId,
  });
  if (existing) return { training: existing, created: false };

  const opportunity = await Opportunity.findById(params.opportunityId);
  if (!opportunity) throw new NotFoundError('Opportunity not found for training provisioning');

  const company = await Company.findById(opportunity.companyId);
  if (!company) throw new NotFoundError('Company not found for training provisioning');

  const durationWeeks = Math.max(
    1,
    Math.round((opportunity.endDate.getTime() - opportunity.startDate.getTime()) / MS_PER_WEEK)
  );

  const training = await Training.create({
    studentId: params.studentId,
    companyId: opportunity.companyId,
    opportunityId: opportunity._id,
    trainingEntityName: company.nameEn,
    startDate: opportunity.startDate,
    endDate: opportunity.endDate,
    durationWeeks,
    status: TrainingStatus.NOMINATED,
  });

  company.studentsAccepted = (company.studentsAccepted || 0) + 1;
  await company.save();

  return { training, created: true };
}
