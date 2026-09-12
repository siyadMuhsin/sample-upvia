import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchResultDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  score: number;
  breakdown: {
    specializationScore: number;
    skillsScore: number;
    academicEligibilityScore: number;
    gpaScore: number;
    experienceScore: number;
    locationScore: number;
    otherScore: number;
  };
  matchedSkills: Array<{
    skillId: string;
    name: string;
    studentLevel: number;
    requiredLevel: number;
  }>;
  missingSkills: Array<{
    skillId: string;
    name: string;
    requiredLevel: number;
  }>;
  matchedCourses: Array<{
    courseCode: string;
    name: string;
  }>;
  recommendedCourses: Array<{
    courseCode: string;
    name: string;
    targetSkill: string;
  }>;
  eligibility: {
    eligible: boolean;
    reasons: string[];
  };
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchResultSchema = new Schema<IMatchResultDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100, index: true },
    breakdown: {
      specializationScore: { type: Number, required: true },
      skillsScore: { type: Number, required: true },
      academicEligibilityScore: { type: Number, required: true },
      gpaScore: { type: Number, required: true },
      experienceScore: { type: Number, required: true },
      locationScore: { type: Number, required: true },
      otherScore: { type: Number, required: true },
    },
    matchedSkills: [
      {
        skillId: { type: String, required: true },
        name: { type: String, required: true },
        studentLevel: { type: Number, required: true },
        requiredLevel: { type: Number, required: true },
      },
    ],
    missingSkills: [
      {
        skillId: { type: String, required: true },
        name: { type: String, required: true },
        requiredLevel: { type: Number, required: true },
      },
    ],
    matchedCourses: [
      {
        courseCode: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],
    recommendedCourses: [
      {
        courseCode: { type: String, required: true },
        name: { type: String, required: true },
        targetSkill: { type: String, required: true },
      },
    ],
    eligibility: {
      eligible: { type: Boolean, required: true },
      reasons: [{ type: String }],
    },
    explanation: { type: String, required: true },
  },
  { timestamps: true }
);

MatchResultSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });
MatchResultSchema.index({ studentId: 1, score: -1 });

export const MatchResult = mongoose.model<IMatchResultDocument>('MatchResult', MatchResultSchema);
