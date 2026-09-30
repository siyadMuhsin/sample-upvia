import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  titleEn: string;
  titleAr?: string;
  messageEn: string;
  messageAr?: string;
  type: string;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    titleEn: { type: String, required: true },
    titleAr: { type: String },
    messageEn: { type: String, required: true },
    messageAr: { type: String },
    type: { type: String, required: true, index: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);

// User Notification Preferences
export interface INotificationPreferenceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  applicationUpdates: boolean;
  trainingAlerts: boolean;
  jobOfferAlerts: boolean;
  marketingEmails: boolean;
}

const NotificationPreferenceSchema = new Schema<INotificationPreferenceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    emailNotifications: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    trainingAlerts: { type: Boolean, default: true },
    jobOfferAlerts: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationPreference = mongoose.model<INotificationPreferenceDocument>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
