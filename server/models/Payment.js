const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true, // full quoted price
    },
    commission: {
      type: Number,
      required: true, // platform fee (10%)
    },
    workerPayout: {
      type: Number,
      required: true, // 90% goes to worker
    },
    status: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded'],
      default: 'pending',
    },
    orderId: {
      type: String,
      unique: true,
    },
    paidAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ customerId: 1 });
paymentSchema.index({ workerId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
