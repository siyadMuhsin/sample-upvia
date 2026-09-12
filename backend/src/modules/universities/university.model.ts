import mongoose, { Schema, Document } from 'mongoose';

// University
export interface IUniversityDocument extends Document {
  nameEn: string;
  nameAr: string;
  code: string;
  logoUrl?: string;
  website?: string;
  city: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema = new Schema<IUniversityDocument>(
  {
    nameEn: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    logoUrl: { type: String },
    website: { type: String },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'Saudi Arabia' },
  },
  { timestamps: true }
);

export const University = mongoose.model<IUniversityDocument>('University', UniversitySchema);

// College
export interface ICollegeDocument extends Document {
  universityId: mongoose.Types.ObjectId;
  nameEn: string;
  nameAr: string;
  code: string;
  deanName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CollegeSchema = new Schema<ICollegeDocument>(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    nameEn: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    deanName: { type: String, trim: true },
  },
  { timestamps: true }
);

CollegeSchema.index({ universityId: 1, code: 1 }, { unique: true });
export const College = mongoose.model<ICollegeDocument>('College', CollegeSchema);

// Department
export interface IDepartmentDocument extends Document {
  collegeId: mongoose.Types.ObjectId;
  nameEn: string;
  nameAr: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartmentDocument>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    nameEn: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

DepartmentSchema.index({ collegeId: 1, code: 1 }, { unique: true });
export const Department = mongoose.model<IDepartmentDocument>('Department', DepartmentSchema);

// Program
export interface IProgramDocument extends Document {
  departmentId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  nameEn: string;
  nameAr: string;
  code: string;
  degreeLevel: 'BACHELOR' | 'MASTER' | 'PHD' | 'DIPLOMA';
  targetEmploymentRate: number;
  currentEmploymentRate: number;
  totalCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgramDocument>(
  {
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    nameEn: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    degreeLevel: {
      type: String,
      enum: ['BACHELOR', 'MASTER', 'PHD', 'DIPLOMA'],
      default: 'BACHELOR',
    },
    targetEmploymentRate: { type: Number, default: 85 },
    currentEmploymentRate: { type: Number, default: 0 },
    totalCredits: { type: Number, required: true, default: 130 },
  },
  { timestamps: true }
);

ProgramSchema.index({ collegeId: 1, code: 1 }, { unique: true });
export const Program = mongoose.model<IProgramDocument>('Program', ProgramSchema);

// Batch
export interface IBatchDocument extends Document {
  universityId: mongoose.Types.ObjectId;
  nameEn: string;
  nameAr: string;
  year: number;
  semester: 'FALL' | 'SPRING' | 'SUMMER';
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatchDocument>(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    nameEn: { type: String, required: true },
    nameAr: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: String, enum: ['FALL', 'SPRING', 'SUMMER'], required: true },
  },
  { timestamps: true }
);

BatchSchema.index({ universityId: 1, year: 1, semester: 1 }, { unique: true });
export const Batch = mongoose.model<IBatchDocument>('Batch', BatchSchema);
