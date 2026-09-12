import mongoose, { Schema, Document } from 'mongoose';

export interface IGraduateDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  universityId: mongoose.Types.ObjectId;
  graduationYear: number;
  graduationDate: Date;
  cumulativeGpa: number;
  employmentStatus: 'EMPLOYED' | 'UNEMPLOYED' | 'SEEKING' | 'HIGHER_STUDIES';
  currentEmployer?: string;
  currentJobTitle?: string;
  currentSector?: string;
  salaryRange?: string;
  monthsToFirstJob?: number;
  createdAt: Date;
  updatedAt: Date;
}

const GraduateSchema = new Schema<IGraduateDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    graduationYear: { type: Number, required: true, index: true },
    graduationDate: { type: Date, required: true },
    cumulativeGpa: { type: Number, required: true },
    employmentStatus: {
      type: String,
      enum: ['EMPLOYED', 'UNEMPLOYED', 'SEEKING', 'HIGHER_STUDIES'],
      default: 'SEEKING',
      index: true,
    },
    currentEmployer: { type: String },
    currentJobTitle: { type: String },
    currentSector: { type: String },
    salaryRange: { type: String },
    monthsToFirstJob: { type: Number },
  },
  { timestamps: true }
);

GraduateSchema.index({ programId: 1, employmentStatus: 1 });
export const Graduate = mongoose.model<IGraduateDocument>('Graduate', GraduateSchema);

// Graduate Follow-Up Survey Model (3, 6, 12, 24 months)
export interface IGraduateFollowUpDocument extends Document {
  graduateId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  milestone: '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | '24_MONTHS';
  employmentStatus: 'EMPLOYED' | 'UNEMPLOYED' | 'SEEKING' | 'HIGHER_STUDIES';
  employerName?: string;
  jobTitle?: string;
  sector?: string;
  monthlySalary?: number;
  specializationRelevance: 'DIRECTLY_RELATED' | 'SOMEWHAT_RELATED' | 'NOT_RELATED';
  graduateSatisfaction: number; // 1-5
  employerSatisfaction?: number; // 1-5
  requiredSkillsUsed: string[];
  missingSkillsIdentified: string[];
  surveyCompletedAt: Date;
}

const GraduateFollowUpSchema = new Schema<IGraduateFollowUpDocument>(
  {
    graduateId: { type: Schema.Types.ObjectId, ref: 'Graduate', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    milestone: {
      type: String,
      enum: ['3_MONTHS', '6_MONTHS', '12_MONTHS', '24_MONTHS'],
      required: true,
    },
    employmentStatus: {
      type: String,
      enum: ['EMPLOYED', 'UNEMPLOYED', 'SEEKING', 'HIGHER_STUDIES'],
      required: true,
    },
    employerName: { type: String },
    jobTitle: { type: String },
    sector: { type: String },
    monthlySalary: { type: Number },
    specializationRelevance: {
      type: String,
      enum: ['DIRECTLY_RELATED', 'SOMEWHAT_RELATED', 'NOT_RELATED'],
      default: 'DIRECTLY_RELATED',
    },
    graduateSatisfaction: { type: Number, required: true, min: 1, max: 5 },
    employerSatisfaction: { type: Number, min: 1, max: 5 },
    requiredSkillsUsed: [{ type: String }],
    missingSkillsIdentified: [{ type: String }],
    surveyCompletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

GraduateFollowUpSchema.index({ graduateId: 1, milestone: 1 }, { unique: true });
export const GraduateFollowUp = mongoose.model<IGraduateFollowUpDocument>(
  'GraduateFollowUp',
  GraduateFollowUpSchema
);
