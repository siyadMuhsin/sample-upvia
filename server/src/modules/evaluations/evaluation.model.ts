import mongoose, { Schema, Document } from 'mongoose';

// Training Evaluation (by Company / Academic Supervisor)
export interface ITrainingEvaluationDocument extends Document {
  trainingId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  evaluatorId: mongoose.Types.ObjectId;
  evaluatorType: 'COMPANY_SUPERVISOR' | 'ACADEMIC_SUPERVISOR';
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  teamwork: number;
  professionalism: number;
  attendance: number;
  qualityOfWork: number;
  initiative: number;
  learningAbility: number;
  overallPerformance: number;
  averageScore: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingEvaluationSchema = new Schema<ITrainingEvaluationDocument>(
  {
    trainingId: { type: Schema.Types.ObjectId, ref: 'Training', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    evaluatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    evaluatorType: {
      type: String,
      enum: ['COMPANY_SUPERVISOR', 'ACADEMIC_SUPERVISOR'],
      required: true,
    },
    technicalSkills: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    problemSolving: { type: Number, required: true, min: 1, max: 5 },
    teamwork: { type: Number, required: true, min: 1, max: 5 },
    professionalism: { type: Number, required: true, min: 1, max: 5 },
    attendance: { type: Number, required: true, min: 1, max: 5 },
    qualityOfWork: { type: Number, required: true, min: 1, max: 5 },
    initiative: { type: Number, required: true, min: 1, max: 5 },
    learningAbility: { type: Number, required: true, min: 1, max: 5 },
    overallPerformance: { type: Number, required: true, min: 1, max: 5 },
    averageScore: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String },
  },
  { timestamps: true }
);

TrainingEvaluationSchema.index({ trainingId: 1, evaluatorType: 1 }, { unique: true });
export const TrainingEvaluation = mongoose.model<ITrainingEvaluationDocument>(
  'TrainingEvaluation',
  TrainingEvaluationSchema
);

// Company Evaluation (by Student)
export interface ICompanyEvaluationDocument extends Document {
  trainingId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  trainingQuality: number;
  tasksRelevance: number;
  supervisionQuality: number;
  workEnvironment: number;
  specializationRelevance: number;
  learningOpportunities: number;
  employmentOpportunities: number;
  averageScore: number;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyEvaluationSchema = new Schema<ICompanyEvaluationDocument>(
  {
    trainingId: { type: Schema.Types.ObjectId, ref: 'Training', required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    trainingQuality: { type: Number, required: true, min: 1, max: 5 },
    tasksRelevance: { type: Number, required: true, min: 1, max: 5 },
    supervisionQuality: { type: Number, required: true, min: 1, max: 5 },
    workEnvironment: { type: Number, required: true, min: 1, max: 5 },
    specializationRelevance: { type: Number, required: true, min: 1, max: 5 },
    learningOpportunities: { type: Number, required: true, min: 1, max: 5 },
    employmentOpportunities: { type: Number, required: true, min: 1, max: 5 },
    averageScore: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String },
  },
  { timestamps: true }
);

export const CompanyEvaluation = mongoose.model<ICompanyEvaluationDocument>(
  'CompanyEvaluation',
  CompanyEvaluationSchema
);
