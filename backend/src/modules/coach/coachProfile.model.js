import mongoose from 'mongoose';

const coachProfileSchema = new mongoose.Schema(
  {
    coachId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
      max: 80,
    },
    certifications: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 30,
    },
    preferredTrainingType: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    coachingStyle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    joinedDate: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    slots: {
      type: String,
      trim: true,
      default: 'Mon - Fri, 6:00 AM - 10:00 AM',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const CoachProfile = mongoose.model('CoachProfile', coachProfileSchema);

