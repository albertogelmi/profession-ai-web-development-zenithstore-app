import { Schema, model, Document } from 'mongoose';

export type NotificationType = 'order' | 'offer' | 'advertising' | 'promo_personalized';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotification extends Document {
  customerId: number;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  priority: NotificationPriority;
  isRead: boolean;
  isDelivered: boolean;
  createdAt: Date;
  readAt?: Date;
  deliveredAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    customerId: { type: Number, required: true, index: true },
    type: {
      type: String,
      enum: ['order', 'offer', 'advertising', 'promo_personalized'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    icon: { type: String, trim: true, maxlength: 100 },
    link: { type: String, trim: true, maxlength: 500 },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      required: true,
      default: 'normal',
    },
    isRead: { type: Boolean, required: true, default: false },
    isDelivered: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, default: Date.now },
    readAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  {
    collection: 'notifications',
    timestamps: false,
  }
);

// Indexes (matching mongo-init.js)
notificationSchema.index({ customerId: 1, isRead: 1 });
notificationSchema.index({ customerId: 1, createdAt: -1 });
notificationSchema.index({ customerId: 1, isDelivered: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
