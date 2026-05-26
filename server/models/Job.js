const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
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
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [100, 'Budget must be at least LKR 100'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'awaiting-payment', 'in-progress', 'under-review', 'completed', 'cancelled', 'disputed'],
      default: 'pending',
    },
    deadline: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      default: '',
    },
    attachments: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: '',
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    workerReviewed: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    workerQuotation: {
      price: { type: Number, default: null },
      availableDate: { type: Date, default: null },
      notes: { type: String, default: '' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      sentAt: { type: Date, default: null },
    },
    complaintDetails: {
      reason: { type: String, default: null },
      date: { type: Date, default: null },
      attachments: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
jobSchema.index({ customerId: 1, status: 1 });
jobSchema.index({ workerId: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
