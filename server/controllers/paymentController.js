const Job = require('../models/Job');
const Payment = require('../models/Payment');
const WorkerWallet = require('../models/WorkerWallet');
const Notification = require('../models/Notification');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

const COMMISSION_RATE = 0.10; // 10% platform fee

// ── Helper: generate unique order ID ──────────────────────────────────────
const generateOrderId = () =>
  'SM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

/**
 * @desc    Initiate payment for a job (called when customer taps "Pay Now")
 * @route   POST /api/payments/initiate
 * @access  Private (customer)
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findById(jobId)
      .populate('workerId', 'name email')
      .populate('customerId', 'name email');

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    if (!job.workerQuotation || !job.workerQuotation.price) {
      return res.status(400).json({ success: false, message: 'No quotation found on this job' });
    }

    // Prevent duplicate payments
    const existing = await Payment.findOne({ jobId, status: { $in: ['held', 'released'] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Payment already completed for this job' });
    }

    const amount = job.workerQuotation.price;
    const commission = parseFloat((amount * COMMISSION_RATE).toFixed(2));
    const workerPayout = parseFloat((amount - commission).toFixed(2));
    const orderId = generateOrderId();

    // Create (or update) a pending payment record
    await Payment.findOneAndUpdate(
      { jobId, status: 'pending' },
      {
        jobId,
        customerId: req.user._id,
        workerId: job.workerId._id,
        amount,
        commission,
        workerPayout,
        orderId,
        status: 'pending',
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      order: {
        orderId,
        jobTitle: job.title,
        workerName: job.workerId.name,
        amount,
        commission,
        workerPayout,
        currency: 'LKR',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm (simulate) payment — dummy version, no real gateway
 * @route   POST /api/payments/confirm
 * @access  Private (customer)
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { jobId, orderId } = req.body;

    const payment = await Payment.findOne({ jobId, orderId, status: 'pending' });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found or already processed' });
    }

    // Mark payment as held (funds in escrow)
    payment.status = 'held';
    payment.paidAt = new Date();
    await payment.save();

    // Move job to in-progress + record paymentId
    const job = await Job.findByIdAndUpdate(
      jobId,
      { 
        status: 'in-progress', 
        paymentId: payment._id,
        'workerQuotation.status': 'accepted' 
      },
      { new: true }
    ).populate('workerId', 'name');

    // Add to worker's pending balance
    await WorkerWallet.findOneAndUpdate(
      { workerId: payment.workerId },
      {
        $inc: { pendingBalance: payment.workerPayout },
        $push: {
          transactions: {
            jobId,
            paymentId: payment._id,
            amount: payment.workerPayout,
            type: 'credit',
            description: `Payment held for job: ${job.title}`,
          },
        },
      },
      { upsert: true }
    );

    // Notify worker
    await Notification.create({
      userId: payment.workerId,
      type: 'job_request',
      title: 'Payment Received — Job Started!',
      message: `Customer has paid ${payment.amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })} for "${job.title}". Job is now in progress!`,
      link: '/dashboard/worker/jobs',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(payment.workerId.toString()).emit('notification', {
        type: 'payment_received',
        message: `Payment confirmed for: ${job.title}`,
      });
    }

    res.json({
      success: true,
      message: 'Payment confirmed. Job is now in progress!',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release held payment to worker (called when job completed & confirmed)
 * @route   POST /api/payments/:jobId/release
 * @access  Private (customer or auto)
 */
const releasePayment = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const payment = await Payment.findOne({ jobId, status: 'held' });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'No held payment for this job' });
    }

    // Release: move pending → available balance
    payment.status = 'released';
    payment.releasedAt = new Date();
    await payment.save();

    await WorkerWallet.findOneAndUpdate(
      { workerId: payment.workerId },
      {
        $inc: {
          balance: payment.workerPayout,
          totalEarned: payment.workerPayout,
          pendingBalance: -payment.workerPayout,
        },
        $push: {
          transactions: {
            jobId,
            paymentId: payment._id,
            amount: payment.workerPayout,
            type: 'credit',
            description: `Earnings released for job`,
          },
        },
      },
      { upsert: true }
    );

    // Notify worker
    await Notification.create({
      userId: payment.workerId,
      type: 'job_request',
      title: 'Earnings Released! 🎉',
      message: `LKR ${payment.workerPayout.toLocaleString()} has been added to your wallet.`,
      link: '/dashboard/worker/earnings',
    });

    res.json({ success: true, message: 'Payment released to worker', payment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker wallet and transaction history
 * @route   GET /api/payments/wallet
 * @access  Private (worker)
 */
const getWallet = async (req, res, next) => {
  try {
    let wallet = await WorkerWallet.findOne({ workerId: req.user._id })
      .populate('transactions.jobId', 'title');

    if (!wallet) {
      wallet = { balance: 0, totalEarned: 0, totalWithdrawn: 0, pendingBalance: 0, transactions: [] };
    }

    res.json({ success: true, wallet });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform revenue summary (admin)
 * @route   GET /api/payments/revenue
 * @access  Private (admin)
 */
const getRevenue = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: { $in: ['held', 'released', 'refunded'] } })
      .populate('customerId', 'name email')
      .populate('workerId', 'name email')
      .populate('jobId', 'title status complaintDetails')
      .sort('-createdAt');

    const totalRevenue = payments.reduce((sum, p) => sum + p.commission, 0);
    const totalTransactions = payments.length;
    const releasedRevenue = payments
      .filter(p => p.status === 'released')
      .reduce((sum, p) => sum + p.commission, 0);
    const pendingRevenue = payments
      .filter(p => p.status === 'held')
      .reduce((sum, p) => sum + p.commission, 0);

    // Monthly revenue for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = {};
    payments
      .filter(p => p.paidAt && p.paidAt > sixMonthsAgo)
      .forEach(p => {
        const key = p.paidAt.toISOString().substring(0, 7); // "2026-05"
        monthly[key] = (monthly[key] || 0) + p.commission;
      });

    res.json({
      success: true,
      summary: { totalRevenue, releasedRevenue, pendingRevenue, totalTransactions },
      monthly,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refund a disputed payment (Admin)
 * @route   POST /api/payments/:jobId/refund
 * @access  Private (admin)
 */
const refundPayment = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const payment = await Payment.findOne({ jobId, status: 'held' });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'No held payment found to refund' });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Job is not in disputed status' });
    }

    // Process refund
    payment.status = 'refunded';
    payment.releasedAt = new Date(); // Using releasedAt as completed time
    await payment.save();

    // Cancel job
    job.status = 'cancelled';
    job.cancelReason = 'Refunded after dispute: ' + (job.complaintDetails?.reason || '');
    await job.save();

    // Remove pending balance from worker
    await WorkerWallet.findOneAndUpdate(
      { workerId: payment.workerId },
      {
        $inc: { pendingBalance: -payment.workerPayout },
        $push: {
          transactions: {
            jobId,
            paymentId: payment._id,
            amount: payment.workerPayout,
            type: 'debit', // This is removing the pending amount
            description: `Payment refunded for disputed job: ${job.title}`,
          },
        },
      }
    );

    // Notifications
    await Notification.create([
      {
        userId: job.customerId,
        type: 'job_cancelled',
        title: 'Refund Issued',
        message: `Your dispute for "${job.title}" was resolved and LKR ${payment.amount.toLocaleString()} was refunded.`,
        link: '/dashboard/customer/jobs',
      },
      {
        userId: job.workerId,
        type: 'job_cancelled',
        title: 'Job Cancelled & Refunded',
        message: `The dispute for "${job.title}" was resolved in favor of the customer. Payment was refunded.`,
        link: '/dashboard/worker/jobs',
      }
    ]);

    res.json({ success: true, message: 'Payment refunded and job cancelled', payment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save/update worker's bank details to wallet profile
 * @route   POST /api/payments/bank-details
 * @access  Private (worker)
 */
const saveBankDetails = async (req, res, next) => {
  try {
    const { bankName, accountNumber, branchName, accountHolderName } = req.body;

    if (!bankName || !accountNumber || !branchName || !accountHolderName) {
      return res.status(400).json({ success: false, message: 'All bank details are required' });
    }

    const wallet = await WorkerWallet.findOneAndUpdate(
      { workerId: req.user._id },
      { $set: { bankDetails: { bankName, accountNumber, branchName, accountHolderName } } },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Bank details saved successfully', bankDetails: wallet.bankDetails });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker's saved bank details
 * @route   GET /api/payments/bank-details
 * @access  Private (worker)
 */
const getBankDetails = async (req, res, next) => {
  try {
    const wallet = await WorkerWallet.findOne({ workerId: req.user._id }).select('bankDetails');
    res.json({ success: true, bankDetails: wallet?.bankDetails || null });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Worker requests a withdrawal
 * @route   POST /api/payments/withdraw
 * @access  Private (worker)
 */
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, bankName, accountNumber, branchName, accountHolderName, saveDetails } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is LKR 100' });
    }
    if (!bankName || !accountNumber || !branchName || !accountHolderName) {
      return res.status(400).json({ success: false, message: 'All bank details are required' });
    }

    const wallet = await WorkerWallet.findOne({ workerId: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: LKR ${wallet?.balance?.toLocaleString() || 0}`,
      });
    }

    // Create withdrawal request
    const request = await WithdrawalRequest.create({
      workerId: req.user._id,
      amount,
      bankName,
      accountNumber,
      branchName,
      accountHolderName,
    });

    // Deduct from available balance immediately and record transaction
    await WorkerWallet.findOneAndUpdate(
      { workerId: req.user._id },
      {
        $inc: { balance: -amount, totalWithdrawn: amount },
        $push: {
          transactions: {
            amount,
            type: 'withdrawal',
            description: `Withdrawal request #${request._id.toString().slice(-6).toUpperCase()} — Under review`,
          },
        },
        // Optionally save bank details
        ...(saveDetails ? { $set: { bankDetails: { bankName, accountNumber, branchName, accountHolderName } } } : {}),
      }
    );

    // Notify worker
    await Notification.create({
      userId: req.user._id,
      type: 'job_request',
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal of LKR ${amount.toLocaleString()} has been submitted and is under review.`,
      link: '/dashboard/worker/earnings',
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted! Admin will process within 1–2 business days.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker's own withdrawal requests
 * @route   GET /api/payments/withdraw
 * @access  Private (worker)
 */
const getMyWithdrawals = async (req, res, next) => {
  try {
    const requests = await WithdrawalRequest.find({ workerId: req.user._id }).sort('-createdAt');
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: get all withdrawal requests
 * @route   GET /api/payments/withdrawals
 * @access  Private (admin)
 */
const getAllWithdrawals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await WithdrawalRequest.find(filter)
      .populate('workerId', 'name email phone')
      .sort('-createdAt');
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: process a withdrawal request and send email slip
 * @route   PUT /api/payments/withdrawals/:id/process
 * @access  Private (admin)
 */
const processWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const request = await WithdrawalRequest.findById(id).populate('workerId', 'name email phone');
    if (!request) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    if (request.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This request has already been processed' });
    }

    const transactionRef = 'TXN-' + Date.now().toString(36).toUpperCase();

    request.status = 'completed';
    request.adminNote = adminNote || '';
    request.processedAt = new Date();
    request.transactionRef = transactionRef;
    await request.save();

    // Send payment slip email to worker
    const worker = request.workerId;
    const slipHtml = `
      <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;background:#f8fafc;padding:0;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;letter-spacing:-0.5px;">🇱🇰 SkillMatch.lk</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Payment Confirmation Slip</p>
        </div>

        <!-- Success badge -->
        <div style="text-align:center;padding:28px 40px 0;">
          <div style="display:inline-block;background:#dcfce7;border-radius:100px;padding:10px 24px;">
            <span style="color:#16a34a;font-weight:700;font-size:14px;">✅ Transfer Completed</span>
          </div>
        </div>

        <!-- Amount -->
        <div style="text-align:center;padding:20px 40px;">
          <p style="color:#64748b;font-size:14px;margin:0 0 4px;">Amount Transferred</p>
          <p style="color:#0f172a;font-size:42px;font-weight:800;margin:0;">LKR ${request.amount.toLocaleString('en-LK')}</p>
        </div>

        <!-- Details card -->
        <div style="margin:0 24px 24px;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Transaction Details</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:14px 24px;color:#64748b;font-size:14px;">Transaction Ref</td>
              <td style="padding:14px 24px;color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${transactionRef}</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:14px 24px;color:#64748b;font-size:14px;">Worker</td>
              <td style="padding:14px 24px;color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${worker.name}</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:14px 24px;color:#64748b;font-size:14px;">Account Holder</td>
              <td style="padding:14px 24px;color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${request.accountHolderName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:14px 24px;color:#64748b;font-size:14px;">Bank</td>
              <td style="padding:14px 24px;color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${request.bankName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:14px 24px;color:#64748b;font-size:14px;">Branch</td>
              <td style="padding:14px 24px;color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${request.branchName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:14px 24px;color:#64748b;font-size:14px;">Account Number</td>
              <td style="padding:14px 24px;color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${request.accountNumber.replace(/\d(?=\d{4})/g, '*')}</td>
            </tr>
            <tr>
              <td style="padding:14px 24px;color:#64748b;font-size:14px;">Processed On</td>
              <td style="padding:14px 24px;color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${new Date().toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}</td>
            </tr>
          </table>
        </div>

        ${adminNote ? `<div style="margin:0 24px 24px;background:#fef9c3;border-radius:10px;padding:14px 20px;"><p style="margin:0;font-size:13px;color:#854d0e;"><strong>Note from SkillMatch:</strong> ${adminNote}</p></div>` : ''}

        <!-- Footer -->
        <div style="text-align:center;padding:20px 40px 32px;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Thank you for being part of SkillMatch.lk</p>
          <p style="color:#cbd5e1;font-size:11px;margin:4px 0 0;">If you have any questions, contact support@skillmatch.lk</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: worker.email,
        subject: `SkillMatch.lk — Payment Slip: LKR ${request.amount.toLocaleString()} transferred`,
        html: slipHtml,
      });
      request.slipEmailSentAt = new Date();
      await request.save();
    } catch (emailErr) {
      console.error('Slip email failed:', emailErr.message);
      // Don't fail the whole request if email fails
    }

    // Notify worker in-app
    await Notification.create({
      userId: request.workerId._id || request.workerId,
      type: 'job_request',
      title: '💰 Withdrawal Processed!',
      message: `LKR ${request.amount.toLocaleString()} has been transferred to your ${request.bankName} account. Check your email for the payment slip.`,
      link: '/dashboard/worker/earnings',
    });

    res.json({
      success: true,
      message: `Withdrawal processed. Payment slip sent to ${worker.email}.`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  confirmPayment,
  releasePayment,
  getWallet,
  getRevenue,
  refundPayment,
  saveBankDetails,
  getBankDetails,
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  processWithdrawal,
};
