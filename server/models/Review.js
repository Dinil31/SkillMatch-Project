const mongoose = require('mongoose');
const WorkerProfile = require('./WorkerProfile');

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker ID is required'],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    direction: {
      type: String,
      enum: ['customer_to_worker', 'worker_to_customer'],
      default: 'customer_to_worker',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    reply: {
      text: {
        type: String,
        maxlength: [1000, 'Reply cannot exceed 1000 characters'],
      },
      createdAt: {
        type: Date,
      },
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// After saving a review, recalculate worker's average rating
reviewSchema.post('save', async function () {
  try {
    if (this.direction === 'customer_to_worker') {
      const stats = await this.constructor.aggregate([
        { $match: { workerId: this.workerId, isVisible: true, direction: 'customer_to_worker' } },
      {
        $group: {
          _id: '$workerId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const newRating = Math.round(stats[0].averageRating * 10) / 10;
      const newCount = stats[0].totalReviews;
      await WorkerProfile.findOneAndUpdate(
        { userId: this.workerId },
        {
          averageRating: newRating,
          totalReviews: newCount,
        }
      );
      // Update all gigs for this worker
      const Gig = mongoose.model('Gig');
      await Gig.updateMany(
        { workerId: this.workerId },
        {
          workerRating: newRating,
          workerReviewsCount: newCount,
        }
      );
    }
    }
  } catch (error) {
    console.error('Error updating worker rating:', error);
  }
});

// After deleting a review, recalculate worker's average rating
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    if (doc.direction === 'customer_to_worker') {
      const stats = await doc.constructor.aggregate([
        { $match: { workerId: doc.workerId, isVisible: true, direction: 'customer_to_worker' } },
      {
        $group: {
          _id: '$workerId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    await WorkerProfile.findOneAndUpdate(
      { userId: doc.workerId },
      {
        averageRating: stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0,
        totalReviews: stats.length > 0 ? stats[0].totalReviews : 0,
      }
    );
    }
  } catch (error) {
    console.error('Error updating worker rating after delete:', error);
  }
});

// Indexes
reviewSchema.index({ jobId: 1, direction: 1 }, { unique: true });
reviewSchema.index({ workerId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
