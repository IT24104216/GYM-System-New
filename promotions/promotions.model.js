import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    placement: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    target: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT', 'PAUSED'],
      default: 'DRAFT',
      index: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
    link: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: '',
    },
    image: {
      type: String,
      trim: true,
      maxlength: 5000000,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

promotionSchema.index({ status: 1, startDate: 1, endDate: 1, updatedAt: -1 });

export const Promotion = mongoose.model('Promotion', promotionSchema);

