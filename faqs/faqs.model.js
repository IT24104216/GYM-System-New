import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    authorRole: {
      type: String,
      enum: ['coach', 'dietitian', 'admin'],
      required: true,
      index: true,
    },
    authorId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    authorName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

faqSchema.index({ authorRole: 1, isActive: 1, createdAt: -1 });

export const Faq = mongoose.model('Faq', faqSchema);
