import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    last4: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8,
    },
  },
  { _id: false },
);

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ['3month', '6month', '12month'],
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
