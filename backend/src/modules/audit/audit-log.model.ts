import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@upvia/shared';

export interface IAuditLogDocument extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  previousStatus?: string;
  newStatus?: string;
  comment?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, required: true },
    actorRole: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    previousStatus: { type: String },
    newStatus: { type: String },
    comment: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
