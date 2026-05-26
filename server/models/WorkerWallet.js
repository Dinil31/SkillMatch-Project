const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  amount: Number,
  type: { type: String, enum: ['credit', 'withdrawal'], default: 'credit' },
  description: String,
  date: { type: Date, default: Date.now },
});

const workerWalletSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },       // available to withdraw
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 }, // held (job in-progress)
    // Saved bank details (so worker doesn't re-enter every time)
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      branchName: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
    },
    transactions: [walletTransactionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkerWallet', workerWalletSchema);
