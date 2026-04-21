import mongoose from 'mongoose';

const progressMeasurementSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      trim: true,
    },
    chest: { type: Number, min: 0, required: true },
    waist: { type: Number, min: 0, required: true },
    arms: { type: Number, min: 0, required: true },
    thighs: { type: Number, min: 0, required: true },
    bodyFat: { type: Number, min: 0, required: true },
    weight: { type: Number, min: 0, required: true },
  },
  { _id: false },
);

const progressTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    measurements: {
      type: [progressMeasurementSchema],
      default: [],
    },
    photos: {
      type: [
        new mongoose.Schema(
          {
            slot: {
              type: Number,
              enum: [1, 2, 3, 4],
              required: true,
            },
            base64Image: {
              type: String,
              required: true,
            },
            fileName: {
              type: String,
              trim: true,
              default: '',
            },
            fileSize: {
              type: Number,
              min: 0,
              default: 0,
            },
            uploadedAt: {
              type: Date,
              default: Date.now,
            },
            label: {
              type: String,
              trim: true,
              default: '',
            },
            note: {
              type: String,
              trim: true,
              default: '',
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ProgressTracking = mongoose.model('ProgressTracking', progressTrackingSchema);

