import mongoose, { Schema, Document } from 'mongoose';
import { SkillCategory } from '@upvia/shared';

export interface ISkillDocument extends Document {
  nameEn: string;
  nameAr: string;
  category: SkillCategory;
  description?: string;
  levels?: {
    level1?: string;
    level2?: string;
    level3?: string;
    level4?: string;
    level5?: string;
  };
  marketDemandScore?: number; // 0-100 score calculated from opportunities & graduate data
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkillDocument>(
  {
    nameEn: { type: String, required: true, unique: true, trim: true, index: true },
    nameAr: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: Object.values(SkillCategory),
      required: true,
      index: true,
    },
    description: { type: String },
    levels: {
      level1: { type: String, default: 'Beginner / Awareness' },
      level2: { type: String, default: 'Basic application' },
      level3: { type: String, default: 'Intermediate / Competent' },
      level4: { type: String, default: 'Advanced' },
      level5: { type: String, default: 'Expert / Master' },
    },
    marketDemandScore: { type: Number, default: 50 },
  },
  { timestamps: true }
);

export const Skill = mongoose.model<ISkillDocument>('Skill', SkillSchema);
