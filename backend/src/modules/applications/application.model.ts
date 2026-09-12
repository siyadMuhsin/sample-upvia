import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus } from '@upvia/shared';

export interface IApplicationDocument extends Document {
  opportunityId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  cvUrl?: string;
  coverLetter?: string;
  matchScore: number;
  matchDetails?: Record<string, any>;
  notes?: string;
  rejectionReason?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.SUBMITTED,
      index: true,
    },
    cvUrl: { type: String },
    coverLetter: { type: String },
    matchScore: { type: Number, default: 0, min: 0, max: 100 },
    matchDetails: { type: Schema.Types.Mixed },
    notes: { type: String },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ApplicationSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });
ApplicationSchema.index({ opportunityId: 1, status: 1 });

export const Application = mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
