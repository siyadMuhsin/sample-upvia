import mongoose, { Schema, Document } from 'mongoose';
import { JobOfferStatus } from '@upvia/shared';

export interface IJobOfferDocument extends Document {
  trainingId?: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  jobTitleEn: string;
  jobTitleAr?: string;
  salary: number;
  city: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  startDate: Date;
  offerDate: Date;
  status: JobOfferStatus;
  createdAt: Date;
  updatedAt: Date;
}

const JobOfferSchema = new Schema<IJobOfferDocument>(
  {
    trainingId: { type: Schema.Types.ObjectId, ref: 'Training', index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    jobTitleEn: { type: String, required: true, trim: true },
    jobTitleAr: { type: String, trim: true },
    salary: { type: Number, required: true, min: 0 },
    city: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'],
      default: 'FULL_TIME',
    },
    startDate: { type: Date, required: true },
    offerDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: Object.values(JobOfferStatus),
      default: JobOfferStatus.PENDING,
      index: true,
    },
  },
  { timestamps: true }
);

export const JobOffer = mongoose.model<IJobOfferDocument>('JobOffer', JobOfferSchema);
