import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationTargetType = 'all' | 'device';

export interface INotification extends Document {
  title: string;
  body: string;
  targetType: NotificationTargetType;
  targetDeviceId: string | null;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 2000 },
    targetType: { type: String, enum: ['all', 'device'], required: true },
    targetDeviceId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export interface IPlayerNotification extends Document {
  deviceId: string;
  notificationId: Types.ObjectId;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

const PlayerNotificationSchema = new Schema<IPlayerNotification>(
  {
    deviceId: { type: String, required: true, index: true },
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

PlayerNotificationSchema.index({ deviceId: 1, notificationId: 1 }, { unique: true });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export const PlayerNotification =
  mongoose.models.PlayerNotification ||
  mongoose.model<IPlayerNotification>('PlayerNotification', PlayerNotificationSchema);
