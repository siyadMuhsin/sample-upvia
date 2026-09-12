import mongoose, { Schema, Document } from 'mongoose';
import { TrainingStatus, AttendanceStatus, TaskStatus } from '@upvia/shared';

// Main Training Model
export interface ITrainingDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  trainingEntityName: string;
  startDate: Date;
  endDate: Date;
  durationWeeks: number;
  academicSupervisorId?: mongoose.Types.ObjectId;
  companySupervisorId?: mongoose.Types.ObjectId;
  status: TrainingStatus;
  attendancePercentage: number;
  totalHoursCompleted: number;
  finalGrade?: number;
  completionCertificateUrl?: string;
  skillsAcquired: Array<{
    skillId: mongoose.Types.ObjectId;
    skillNameEn: string;
    previousLevel: number;
    newLevel: number;
    evidence?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingSchema = new Schema<ITrainingDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    trainingEntityName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationWeeks: { type: Number, required: true, default: 16 },
    academicSupervisorId: { type: Schema.Types.ObjectId, ref: 'User' },
    companySupervisorId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: Object.values(TrainingStatus),
      default: TrainingStatus.NOMINATED,
      index: true,
    },
    attendancePercentage: { type: Number, default: 100, min: 0, max: 100 },
    totalHoursCompleted: { type: Number, default: 0 },
    finalGrade: { type: Number, min: 0, max: 100 },
    completionCertificateUrl: { type: String },
    skillsAcquired: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill' },
        skillNameEn: { type: String, required: true },
        previousLevel: { type: Number, default: 1 },
        newLevel: { type: Number, default: 3 },
        evidence: { type: String },
      },
    ],
  },
  { timestamps: true }
);

TrainingSchema.index({ studentId: 1, status: 1 });
TrainingSchema.index({ companyId: 1, status: 1 });

export const Training = mongoose.model<ITrainingDocument>('Training', TrainingSchema);

// Training Attendance
export interface ITrainingAttendanceDocument extends Document {
  trainingId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hours: number;
  notes?: string;
}

const AttendanceSchema = new Schema<ITrainingAttendanceDocument>(
  {
    trainingId: { type: Schema.Types.ObjectId, ref: 'Training', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.PRESENT,
    },
    checkIn: { type: String },
    checkOut: { type: String },
    hours: { type: Number, default: 8, min: 0, max: 24 },
    notes: { type: String },
  },
  { timestamps: true }
);

AttendanceSchema.index({ trainingId: 1, date: 1 }, { unique: true });
export const TrainingAttendance = mongoose.model<ITrainingAttendanceDocument>(
  'TrainingAttendance',
  AttendanceSchema
);

// Training Task
export interface ITrainingTaskDocument extends Document {
  trainingId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assignedDate: Date;
  dueDate: Date;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  completedAt?: Date;
  comments?: string;
}

const TaskSchema = new Schema<ITrainingTaskDocument>(
  {
    trainingId: { type: Schema.Types.ObjectId, ref: 'Training', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    completedAt: { type: Date },
    comments: { type: String },
  },
  { timestamps: true }
);

export const TrainingTask = mongoose.model<ITrainingTaskDocument>('TrainingTask', TaskSchema);

// Training Report
export interface ITrainingReportDocument extends Document {
  trainingId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  reportType: 'WEEKLY' | 'MONTHLY' | 'FINAL';
  weekNumber?: number;
  title: string;
  activities: string;
  tasksCompleted: string;
  skillsApplied: string[];
  challenges: string;
  learningOutcomes: string;
  supervisorComments?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  submittedAt: Date;
}

const TrainingReportSchema = new Schema<ITrainingReportDocument>(
  {
    trainingId: { type: Schema.Types.ObjectId, ref: 'Training', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    reportType: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY', 'FINAL'],
      required: true,
    },
    weekNumber: { type: Number },
    title: { type: String, required: true },
    activities: { type: String, required: true },
    tasksCompleted: { type: String, required: true },
    skillsApplied: [{ type: String }],
    challenges: { type: String, required: true },
    learningOutcomes: { type: String, required: true },
    supervisorComments: { type: String },
    status: {
      type: String,
      enum: ['SUBMITTED', 'APPROVED', 'REVISION_REQUESTED'],
      default: 'SUBMITTED',
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TrainingReport = mongoose.model<ITrainingReportDocument>(
  'TrainingReport',
  TrainingReportSchema
);
