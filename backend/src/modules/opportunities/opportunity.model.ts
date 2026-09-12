import mongoose, { Schema, Document } from 'mongoose';
import { OpportunityType, OpportunityStatus, WorkMode } from '@upvia/shared';

export interface IOpportunityDocument extends Document {
  companyId: mongoose.Types.ObjectId;
  titleEn: string;
  titleAr?: string;
  type: OpportunityType;
  descriptionEn: string;
  descriptionAr?: string;
  location: string;
  city: string;
  workMode: WorkMode;
  startDate: Date;
  endDate: Date;
  applicationDeadline: Date;
  numberOfSeats: number;
  seatsRemaining: number;
  requiredSpecializations: string[];
  requiredSkills: Array<{
    skillId: mongoose.Types.ObjectId;
    skillNameEn: string;
    minimumLevel: number;
  }>;
  minimumGPA: number;
  experienceYears: number;
  salary?: number;
  stipend?: number;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  status: OpportunityStatus;
  reviewedByProgramCoordinatorId?: mongoose.Types.ObjectId;
  reviewedByTrainingUnitId?: mongoose.Types.ObjectId;
  approvedByUniversityId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunityDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    titleEn: { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true },
    type: {
      type: String,
      enum: Object.values(OpportunityType),
      required: true,
      index: true,
    },
    descriptionEn: { type: String, required: true },
    descriptionAr: { type: String },
    location: { type: String, required: true },
    city: { type: String, required: true, index: true },
    workMode: {
      type: String,
      enum: Object.values(WorkMode),
      default: WorkMode.HYBRID,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicationDeadline: { type: Date, required: true },
    numberOfSeats: { type: Number, required: true, min: 1 },
    seatsRemaining: { type: Number, required: true, min: 0 },
    requiredSpecializations: [{ type: String, required: true }],
    requiredSkills: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
        skillNameEn: { type: String, required: true },
        minimumLevel: { type: Number, default: 2, min: 1, max: 5 },
      },
    ],
    minimumGPA: { type: Number, default: 2.5, min: 0, max: 5 },
    experienceYears: { type: Number, default: 0 },
    salary: { type: Number },
    stipend: { type: Number },
    benefits: [{ type: String }],
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(OpportunityStatus),
      default: OpportunityStatus.DRAFT,
      index: true,
    },
    reviewedByProgramCoordinatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedByTrainingUnitId: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedByUniversityId: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

OpportunitySchema.index({ status: 1, type: 1 });
OpportunitySchema.index({ city: 1, status: 1 });
OpportunitySchema.index({ requiredSpecializations: 1, status: 1 });

export const Opportunity = mongoose.model<IOpportunityDocument>('Opportunity', OpportunitySchema);
