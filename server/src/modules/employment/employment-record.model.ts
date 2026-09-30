import mongoose, { Schema, Document } from 'mongoose';

export interface IEmploymentRecordDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  companyName: string;
  programId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  universityId: mongoose.Types.ObjectId;
  jobTitle: string;
  sector: string;
  salary: number;
  startDate: Date;
  isPostTrainingHire: boolean;
  trainingId?: mongoose.Types.ObjectId;
  timeToEmploymentMonths: number;
  skillsUsed: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EmploymentRecordSchema = new Schema<IEmploymentRecordDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    companyName: { type: String, required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    jobTitle: { type: String, required: true, index: true },
    sector: { type: String, required: true, index: true },
    salary: { type: Number, required: true },
    startDate: { type: Date, required: true },
    isPostTrainingHire: { type: Boolean, default: false },
    trainingId: { type: Schema.Types.ObjectId, ref: 'Training' },
    timeToEmploymentMonths: { type: Number, default: 3 },
    skillsUsed: [{ type: String }],
  },
  { timestamps: true }
);

EmploymentRecordSchema.index({ programId: 1, isPostTrainingHire: 1 });
EmploymentRecordSchema.index({ sector: 1, salary: -1 });

export const EmploymentRecord = mongoose.model<IEmploymentRecordDocument>(
  'EmploymentRecord',
  EmploymentRecordSchema
);
