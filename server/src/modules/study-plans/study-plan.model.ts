import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyPlanDocument extends Document {
  programId: mongoose.Types.ObjectId;
  version: string;
  year: number;
  isPublished: boolean;
  totalCredits: number;
  courses: Array<{
    courseId: mongoose.Types.ObjectId;
    semester: number;
    isRequired: boolean;
  }>;
  learningOutcomes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanSchema = new Schema<IStudyPlanDocument>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    version: { type: String, required: true, default: '2024.1' },
    year: { type: Number, required: true, default: 2024 },
    isPublished: { type: Boolean, default: true, index: true },
    totalCredits: { type: Number, required: true, default: 130 },
    courses: [
      {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        semester: { type: Number, required: true },
        isRequired: { type: Boolean, default: true },
      },
    ],
    learningOutcomes: [{ type: String }],
  },
  { timestamps: true }
);

StudyPlanSchema.index({ programId: 1, version: 1 }, { unique: true });
export const StudyPlan = mongoose.model<IStudyPlanDocument>('StudyPlan', StudyPlanSchema);
