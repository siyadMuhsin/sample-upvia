import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyDocument extends Document {
  nameEn: string;
  nameAr: string;
  logoUrl?: string;
  descriptionEn: string;
  descriptionAr?: string;
  sector: string;
  industry: string;
  companySize: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  cities: string[];
  website?: string;
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    role: string;
  }>;
  requiredSpecializations: string[];
  requiredSkills: Array<{
    skillId: mongoose.Types.ObjectId;
    skillNameEn: string;
  }>;
  isVerified: boolean;
  totalSeatsOffered: number;
  studentsAccepted: number;
  studentsTrained: number;
  studentsEmployed: number;
  trainingToEmploymentRate: number; // calculated percentage
  averageRating: number; // 1-5 scale calculated from student reviews
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompanyDocument>(
  {
    nameEn: { type: String, required: true, unique: true, trim: true, index: true },
    nameAr: { type: String, required: true, trim: true },
    logoUrl: { type: String },
    descriptionEn: { type: String, required: true },
    descriptionAr: { type: String },
    sector: { type: String, required: true, index: true },
    industry: { type: String, required: true },
    companySize: {
      type: String,
      enum: ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
      default: 'LARGE',
    },
    cities: [{ type: String, required: true }],
    website: { type: String },
    contacts: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        role: { type: String, required: true },
      },
    ],
    requiredSpecializations: [{ type: String }],
    requiredSkills: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill' },
        skillNameEn: { type: String },
      },
    ],
    isVerified: { type: Boolean, default: true },
    totalSeatsOffered: { type: Number, default: 0 },
    studentsAccepted: { type: Number, default: 0 },
    studentsTrained: { type: Number, default: 0 },
    studentsEmployed: { type: Number, default: 0 },
    trainingToEmploymentRate: { type: Number, default: 0 },
    averageRating: { type: Number, default: 4.8 },
  },
  { timestamps: true }
);

CompanySchema.index({ sector: 1, trainingToEmploymentRate: -1 });

export const Company = mongoose.model<ICompanyDocument>('Company', CompanySchema);
