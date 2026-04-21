import mongoose from 'mongoose';

const lockerSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    bookedByUserId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    bookedByName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

lockerSchema.index({ branch: 1, code: 1 }, { unique: true });

const lockerBookingSchema = new mongoose.Schema(
  {
    lockerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    lockerCode: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    userEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    adminMessage: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

lockerBookingSchema.index(
  { lockerId: 1, userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } },
  },
);

export const Locker = mongoose.model('Locker', lockerSchema);
export const LockerBooking = mongoose.model('LockerBooking', lockerBookingSchema);
