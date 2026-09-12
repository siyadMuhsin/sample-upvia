import mongoose, { Schema, Document } from 'mongoose';
import { StudentStatus } from '@upvia/shared';

export interface IStudentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  universityId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  studyPlanId?: mongoose.Types.ObjectId;
  studentStatus: StudentStatus;
  expectedGraduationDate: Date;
  specialization: string;
  gpa: number;
  maxGpa: number;
  creditsCompleted: number;
  passedCourses: string[]; // Course codes
  skills: Array<{
    skillId: mongoose.Types.ObjectId;
    skillNameEn: string;
    level: number;
    verified: boolean;
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  certificates: Array<{
    title: string;
    issuer: string;
    issueDate: Date;
    credentialUrl?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: 'BASIC' | 'INTERMEDIATE' | 'FLUENT' | 'NATIVE';
  }>;
  activities: Array<{
    role: string;
    organization: string;
    startDate: Date;
    endDate?: Date;
  }>;
  cvUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  profileCompletionScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    studentId: { type: String, required: true, unique: true, trim: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    studyPlanId: { type: Schema.Types.ObjectId, ref: 'StudyPlan' },
    studentStatus: {
      type: String,
      enum: Object.values(StudentStatus),
      default: StudentStatus.CURRENT_STUDENT,
      required: true,
      index: true,
    },
    expectedGraduationDate: { type: Date, required: true },
    specialization: { type: String, required: true },
    gpa: { type: Number, required: true, default: 3.5, min: 0, max: 5 },
    maxGpa: { type: Number, required: true, default: 5.0 },
    creditsCompleted: { type: Number, required: true, default: 90 },
    passedCourses: [{ type: String }],
    skills: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
        skillNameEn: { type: String, required: true },
        level: { type: Number, required: true, default: 2, min: 1, max: 5 },
        verified: { type: Boolean, default: false },
      },
    ],
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        technologies: [{ type: String }],
        url: { type: String },
      },
    ],
    certificates: [
      {
        title: { type: String, required: true },
        issuer: { type: String, required: true },
        issueDate: { type: Date, required: true },
        credentialUrl: { type: String },
      },
    ],
    languages: [
      {
        language: { type: String, required: true },
        proficiency: {
          type: String,
          enum: ['BASIC', 'INTERMEDIATE', 'FLUENT', 'NATIVE'],
          default: 'INTERMEDIATE',
        },
      },
    ],
    activities: [
      {
        role: { type: String, required: true },
        organization: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
      },
    ],
    cvUrl: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },
    profileCompletionScore: { type: Number, default: 80, min: 0, max: 100 },
  },
  { timestamps: true }
);

StudentSchema.index({ programId: 1, studentStatus: 1 });
StudentSchema.index({ universityId: 1, studentStatus: 1 });

export const Student = mongoose.model<IStudentDocument>('Student', StudentSchema);
