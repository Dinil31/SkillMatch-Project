const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Gig title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Gig description is required'],
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
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
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [100, 'Price must be at least LKR 100'],
    },
    pricingModel: {
      type: String,
      enum: ['fixed', 'hourly', 'daily', 'custom'],
      default: 'fixed',
    },
    pricingDescription: {
      type: String,
      maxlength: [200, 'Pricing description cannot exceed 200 characters'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'Cannot upload more than 5 images',
      },
    },
    imagePublicIds: {
      type: [String],
      default: [],
    },
    deliveryTime: {
      type: Number,
      min: [1, 'Delivery time must be at least 1'],
    },
    deliveryUnit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days',
    },
    locationType: {
      type: String,
      enum: ['island-wide', 'remote', 'districts', 'radius'],
      default: 'island-wide',
    },
    allowedDistricts: {
      type: [String],
      default: [],
    },
    locationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    locationRadiusKm: {
      type: Number,
      default: 10,
    },
    workerRating: {
      type: Number,
      default: 0,
    },
    workerReviewsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search
gigSchema.index({ category: 1, price: 1, isActive: 1 });
gigSchema.index({ workerId: 1 });
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });
gigSchema.index({ locationCoordinates: '2dsphere' });

module.exports = mongoose.model('Gig', gigSchema);
