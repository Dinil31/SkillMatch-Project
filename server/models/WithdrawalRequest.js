const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [100, 'Minimum withdrawal is LKR 100'],
    },
    // Bank details snapshot at time of request
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    branchName: { type: String, required: true, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    processedAt: Date,
    slipEmailSentAt: Date,
    // Reference to the wallet transaction
    transactionRef: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
