const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      default: '',
    },
    skills: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Cannot have more than 20 skills',
      },
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years'],
      default: 0,
    },
    locationType: {
      type: String,
      enum: ['island-wide', 'districts', 'radius'],
      default: 'island-wide',
    },
    allowedDistricts: {
      type: [String],
      default: [],
    },
    locationRadiusKm: {
      type: Number,
      default: 10,
    },
    locationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
      default: 0,
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'available',
    },
    certifications: {
      type: [String],
      default: [],
    },
    portfolio: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: [
        'Web Development',
        'Mobile Development',
        'Graphic Design',
        'Digital Marketing',
        'Content Writing',
        'Video Editing',
        'Photography',
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Painting',
        'Cleaning',
        'Tutoring',
        'Cooking',
        'Other',
      ],
      default: 'Other',
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
workerProfileSchema.index({ 'locationCoordinates': '2dsphere', category: 1, averageRating: -1 });
workerProfileSchema.index({ skills: 1 });
workerProfileSchema.index({ hourlyRate: 1 });

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
