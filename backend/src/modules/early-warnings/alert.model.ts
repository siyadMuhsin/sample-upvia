import mongoose, { Schema, Document } from 'mongoose';
import { AlertSeverity } from '@upvia/shared';

// Alert Rule Configuration
export interface IAlertRuleDocument extends Document {
  name: string;
  code: string;
  description: string;
  severity: AlertSeverity;
  category: 'STUDENT_TRAINING' | 'PROGRAM_EMPLOYMENT' | 'OPPORTUNITY_TREND' | 'COMPANY_CONVERSION' | 'ATTENDANCE_WARNING';
  thresholdValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRuleSchema = new Schema<IAlertRuleDocument>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['STUDENT_TRAINING', 'PROGRAM_EMPLOYMENT', 'OPPORTUNITY_TREND', 'COMPANY_CONVERSION', 'ATTENDANCE_WARNING'],
      required: true,
    },
    thresholdValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AlertRule = mongoose.model<IAlertRuleDocument>('AlertRule', AlertRuleSchema);

// Active Alert Instances
export interface IAlertDocument extends Document {
  ruleCode?: string;
  severity: AlertSeverity;
  titleEn: string;
  titleAr?: string;
  descriptionEn: string;
  descriptionAr?: string;
  category: string;
  entityType: 'STUDENT' | 'PROGRAM' | 'COLLEGE' | 'COMPANY' | 'TRAINING';
  entityId: mongoose.Types.ObjectId;
  entityName?: string;
  universityId?: mongoose.Types.ObjectId;
  collegeId?: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlertDocument>(
  {
    ruleCode: { type: String },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
      index: true,
    },
    titleEn: { type: String, required: true },
    titleAr: { type: String },
    descriptionEn: { type: String, required: true },
    descriptionAr: { type: String },
    category: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['STUDENT', 'PROGRAM', 'COLLEGE', 'COMPANY', 'TRAINING'],
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityName: { type: String },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College' },
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AlertSchema.index({ severity: 1, resolved: 1 });
AlertSchema.index({ entityType: 1, entityId: 1, resolved: 1 });

export const Alert = mongoose.model<IAlertDocument>('Alert', AlertSchema);
