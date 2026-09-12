import mongoose, { Schema, Document } from 'mongoose';
import { InterviewType, InterviewStatus } from '@upvia/shared';

export interface IInterviewDocument extends Document {
  applicationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  type: InterviewType;
  location?: string;
  meetingUrl?: string;
  interviewers: string[];
  notes?: string;
  result?: 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'PENDING';
  status: InterviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterviewDocument>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(InterviewType),
      default: InterviewType.ONLINE,
    },
    location: { type: String },
    meetingUrl: { type: String },
    interviewers: [{ type: String }],
    notes: { type: String },
    result: {
      type: String,
      enum: ['RECOMMENDED', 'NOT_RECOMMENDED', 'PENDING'],
      default: 'PENDING',
    },
    status: {
      type: String,
      enum: Object.values(InterviewStatus),
      default: InterviewStatus.SCHEDULED,
    },
  },
  { timestamps: true }
);

InterviewSchema.index({ studentId: 1, date: 1 });
InterviewSchema.index({ companyId: 1, date: 1 });

export const Interview = mongoose.model<IInterviewDocument>('Interview', InterviewSchema);
