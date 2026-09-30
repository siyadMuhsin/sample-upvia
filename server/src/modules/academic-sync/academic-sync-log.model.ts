import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicSyncLogDocument extends Document {
  syncType: 'STUDENTS' | 'COURSES' | 'PROGRAMS' | 'GRADES' | 'FULL';
  sourceSystem: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  syncErrors: Array<{ recordIdentifier?: string; message: string }>;
  triggeredBy?: mongoose.Types.ObjectId;
}

const AcademicSyncLogSchema = new Schema<IAcademicSyncLogDocument>(
  {
    syncType: {
      type: String,
      enum: ['STUDENTS', 'COURSES', 'PROGRAMS', 'GRADES', 'FULL'],
      required: true,
      index: true,
    },
    sourceSystem: { type: String, default: 'BANNER_SIS' },
    startedAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'],
      default: 'RUNNING',
      index: true,
    },
    recordsProcessed: { type: Number, default: 0 },
    recordsCreated: { type: Number, default: 0 },
    recordsUpdated: { type: Number, default: 0 },
    recordsFailed: { type: Number, default: 0 },
    syncErrors: [
      {
        recordIdentifier: { type: String },
        message: { type: String, required: true },
      },
    ],
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AcademicSyncLog = mongoose.model<IAcademicSyncLogDocument>(
  'AcademicSyncLog',
  AcademicSyncLogSchema
);
