import mongoose, { Schema, Document } from 'mongoose';

export interface IReportRecordDocument extends Document {
  title: string;
  reportType: string;
  format: 'CSV' | 'EXCEL' | 'PDF' | 'JSON';
  parameters: Record<string, any>;
  fileUrl?: string;
  generatedBy: mongoose.Types.ObjectId;
  fileSizeBytes?: number;
  status: 'GENERATED' | 'PROCESSING' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const ReportRecordSchema = new Schema<IReportRecordDocument>(
  {
    title: { type: String, required: true },
    reportType: { type: String, required: true, index: true },
    format: {
      type: String,
      enum: ['CSV', 'EXCEL', 'PDF', 'JSON'],
      required: true,
    },
    parameters: { type: Schema.Types.Mixed },
    fileUrl: { type: String },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileSizeBytes: { type: Number },
    status: {
      type: String,
      enum: ['GENERATED', 'PROCESSING', 'FAILED'],
      default: 'GENERATED',
    },
  },
  { timestamps: true }
);

export const ReportRecord = mongoose.model<IReportRecordDocument>('ReportRecord', ReportRecordSchema);
