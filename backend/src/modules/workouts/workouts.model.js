import mongoose from 'mongoose';

const workoutExerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    amount: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    assignedMinutes: {
      type: Number,
      min: 1,
      max: 600,
      default: 45,
    },
    sourceType: {
      type: String,
      enum: ['manual', 'category'],
      default: 'manual',
    },
    suggestionKey: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
  },
  {
    _id: false,
  },
);

const workoutPlanSchema = new mongoose.Schema(
  {
    coachId: {
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
    appointmentId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    planTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    planNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    durationDays: {
      type: Number,
      min: 7,
      max: 120,
      default: 30,
    },
    daysPerWeek: {
      type: Number,
      min: 1,
      max: 7,
      default: 4,
    },
    startDate: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    builderType: {
      type: String,
      enum: ['template', 'library', 'custom'],
      default: 'template',
    },
    templateKey: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['assigned', 'completed'],
      default: 'assigned',
      index: true,
    },
    isSubmitted: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedWeeks: {
      type: [Number],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    exercises: {
      type: [workoutExerciseSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one exercise is required',
      },
      default: [],
    },
    programDays: {
      type: [
        new mongoose.Schema(
          {
            dayNumber: { type: Number, required: true, min: 1 },
            date: { type: String, required: true, trim: true },
            isRest: { type: Boolean, default: false },
            title: { type: String, trim: true, default: '' },
            muscles: { type: String, trim: true, default: '' },
            durationMinutes: { type: Number, min: 1, max: 600, default: 45 },
            level: { type: String, trim: true, default: 'Coach Plan' },
            rating: { type: Number, min: 0, max: 5, default: 4.7 },
            exerciseIndexes: { type: [Number], default: [] },
            assigned: { type: Boolean, default: false },
            assignedAt: { type: Date, default: null },
            assignedExerciseIndexes: { type: [Number], default: [] },
            done: { type: Boolean, default: false },
            completedAt: { type: Date, default: null },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    currentDayDate: {
      type: String,
      trim: true,
      default: '',
    },
    session: {
      status: {
        type: String,
        enum: ['idle', 'ongoing', 'completed'],
        default: 'idle',
      },
      startedAt: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },
      elapsedSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },
      exerciseProgress: {
        type: [
          new mongoose.Schema(
            {
              index: { type: Number, required: true, min: 0 },
              done: { type: Boolean, default: false },
              completedAt: { type: Date, default: null },
            },
            { _id: false },
          ),
        ],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

workoutPlanSchema.index({ coachId: 1, userId: 1, createdAt: -1 });

const exerciseCategorySchema = new mongoose.Schema(
  {
    coachId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    categoryKey: {
      type: String,
      enum: ['weightGain', 'weightLoss'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    amount: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

exerciseCategorySchema.index(
  { coachId: 1, categoryKey: 1, name: 1 },
  { unique: true },
);

export const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);
export const ExerciseCategory = mongoose.model('ExerciseCategory', exerciseCategorySchema);
