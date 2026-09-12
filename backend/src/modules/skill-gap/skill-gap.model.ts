import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillGapDocument extends Document {
  programId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  skillName: string;
  marketDemandPercentage: number;
  programCoveragePercentage: number;
  gapPercentage: number;
  status: 'OPTIMAL' | 'MODERATE_GAP' | 'CRITICAL_GAP';
  recommendedAction: string;
  recommendedCourseUpdates?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SkillGapSchema = new Schema<ISkillGapDocument>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    skillName: { type: String, required: true },
    marketDemandPercentage: { type: Number, required: true, min: 0, max: 100 },
    programCoveragePercentage: { type: Number, required: true, min: 0, max: 100 },
    gapPercentage: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['OPTIMAL', 'MODERATE_GAP', 'CRITICAL_GAP'],
      default: 'OPTIMAL',
    },
    recommendedAction: { type: String, required: true },
    recommendedCourseUpdates: [{ type: String }],
  },
  { timestamps: true }
);

SkillGapSchema.index({ programId: 1, skillId: 1 }, { unique: true });
SkillGapSchema.index({ programId: 1, gapPercentage: -1 });

export const SkillGap = mongoose.model<ISkillGapDocument>('SkillGap', SkillGapSchema);
