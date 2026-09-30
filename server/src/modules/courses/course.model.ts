import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseDocument extends Document {
  courseCode: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  credits: number;
  semester: number;
  required: boolean;
  departmentId: mongoose.Types.ObjectId;
  prerequisites: string[];
  skills: Array<{
    skillId: mongoose.Types.ObjectId;
    skillNameEn: string;
    levelTaught: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    courseCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    nameEn: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    descriptionEn: { type: String },
    descriptionAr: { type: String },
    credits: { type: Number, required: true, default: 3 },
    semester: { type: Number, required: true, default: 1 },
    required: { type: Boolean, default: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    prerequisites: [{ type: String }],
    skills: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
        skillNameEn: { type: String, required: true },
        levelTaught: { type: Number, default: 2, min: 1, max: 5 },
      },
    ],
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourseDocument>('Course', CourseSchema);
