import mongoose, { Schema, Document } from 'mongoose';

export interface IFileRecordDocument extends Document {
  originalName: string;
  fileKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  category: 'CV' | 'CERTIFICATE' | 'REPORT' | 'COMPANY_DOCUMENT' | 'AVATAR';
  uploaderId: mongoose.Types.ObjectId;
  entityId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileRecordSchema = new Schema<IFileRecordDocument>(
  {
    originalName: { type: String, required: true },
    fileKey: { type: String, required: true, unique: true, index: true },
    bucket: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    category: {
      type: String,
      enum: ['CV', 'CERTIFICATE', 'REPORT', 'COMPANY_DOCUMENT', 'AVATAR'],
      required: true,
      index: true,
    },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityId: { type: String },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FileRecord = mongoose.model<IFileRecordDocument>('FileRecord', FileRecordSchema);
