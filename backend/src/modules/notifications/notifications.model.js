import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['user', 'coach', 'dietitian', 'admin'],
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'booking',
        'workout',
        'meal',
        'promotion',
        'profile',
        'feedback',
        'locker',
        'faq',
        'admin',
        'system',
      ],
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    entityType: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    entityId: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
