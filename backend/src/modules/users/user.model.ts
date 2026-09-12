import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@upvia/shared';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr?: string;
  lastNameAr?: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  refreshToken?: string;
  universityId?: mongoose.Types.ObjectId;
  collegeId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstNameEn: {
      type: String,
      required: true,
      trim: true,
    },
    lastNameEn: {
      type: String,
      required: true,
      trim: true,
    },
    firstNameAr: {
      type: String,
      trim: true,
    },
    lastNameAr: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    universityId: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      index: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1, universityId: 1 });
UserSchema.index({ role: 1, companyId: 1 });

export const User = mongoose.model<IUserDocument>('User', UserSchema);
