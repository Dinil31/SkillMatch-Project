const Job = require('../models/Job');
const WorkerProfile = require('../models/WorkerProfile');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private (customer)
 */
const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({
      customerId: req.user._id,
      ...req.body,
    });

    // Notify the worker if one is assigned
    if (job.workerId) {
      await Notification.create({
        userId: job.workerId,
        type: 'job_request',
        title: 'New Job Request',
        message: `You have a new job request: "${job.title}"`,
        link: `/dashboard/worker/jobs`,
        metadata: { jobId: job._id },
      });

      // Emit socket notification
      const io = req.app.get('io');
      if (io) {
        io.to(job.workerId.toString()).emit('notification', {
          type: 'job_request',
          message: `New job request: ${job.title}`,
        });
      }
    }

    await job.populate('customerId', 'name email profileImage');

    res.status(201).json({ success: true, message: 'Job created successfully', job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs (admin view)
 * @route   GET /api/jobs
 * @access  Private (admin)
 */
const getJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('customerId', 'name email phone')
        .populate('workerId', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single job by ID
 * @route   GET /api/jobs/:id
 * @access  Private
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customerId', 'name email profileImage phone')
      .populate('workerId', 'name email profileImage phone');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Only allow involved parties or admin
    const isCustomer = job.customerId._id.toString() === req.user._id.toString();
    const isWorker = job.workerId && job.workerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this job' });
    }

    // Phone numbers are now always visible to involved parties
    const contactVisible = true;
    const jobObj = job.toObject();

    res.json({ success: true, job: jobObj, contactVisible });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update job status
 * @route   PUT /api/jobs/:id/status
 * @access  Private
 */
const updateJobStatus = async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const userId = req.user._id.toString();
    const isCustomer = job.customerId.toString() === userId;
    const isWorker = job.workerId && job.workerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    // Validate status transitions
    const allowedTransitions = {
      pending: ['accepted', 'cancelled'],
      accepted: ['in-progress', 'cancelled'],
      'in-progress': ['under-review', 'cancelled', 'disputed'],
      'under-review': ['completed', 'disputed'],
      'disputed': ['cancelled', 'completed']
    };

    if (!allowedTransitions[job.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${job.status}' to '${status}'`,
      });
    }

    // Role-based permission checks
    if (status === 'accepted' && !isWorker && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the assigned worker can accept a job' });
    }
    if (status === 'under-review' && !isWorker && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the worker can mark a job as finished for review' });
    }
    if (status === 'completed' && !isCustomer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the customer can confirm and complete the job' });
    }

    const updates = { status };
    if (status === 'cancelled') {
      updates.cancelReason = cancelReason || '';
    }
    if (status === 'completed') {
      updates.completedAt = new Date();
      // Increment worker's completed jobs count
      if (job.workerId) {
        await WorkerProfile.findOneAndUpdate(
          { userId: job.workerId },
          { $inc: { completedJobs: 1, totalEarnings: job.budget } }
        );
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('customerId', 'name email')
      .populate('workerId', 'name email');

    // Send notifications
    const notifyUserId = isCustomer ? job.workerId : job.customerId;
    if (notifyUserId) {
      const notifMessages = {
        accepted: 'Your job has been accepted by the worker',
        'in-progress': 'Work has started on your job',
        'under-review': 'Worker has finished the job and is waiting for your confirmation',
        completed: 'Your job has been marked as completed',
        cancelled: 'A job has been cancelled',
        disputed: 'A dispute has been raised for this job',
      };

      await Notification.create({
        userId: notifyUserId,
        type: `job_${status.replace('-', '_')}`,
        title: `Job ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: notifMessages[status] || `Job status updated to ${status}`,
        link: isCustomer ? `/dashboard/worker/jobs` : `/dashboard/customer/jobs`,
        metadata: { jobId: job._id },
      });

      const io = req.app.get('io');
      if (io) {
        io.to(notifyUserId.toString()).emit('notification', {
          type: `job_${status}`,
          message: notifMessages[status],
        });
      }
    }

    res.json({ success: true, message: `Job status updated to '${status}'`, job: updatedJob });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get jobs for the logged-in customer
 * @route   GET /api/jobs/customer/my-jobs
 * @access  Private (customer)
 */
const getCustomerJobs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { customerId: req.user._id };
    if (status) filter.status = status;

    const jobs = await Job.find(filter)
      .populate('workerId', 'name profileImage phone')
      .sort('-createdAt');

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get jobs for the logged-in worker
 * @route   GET /api/jobs/worker/my-jobs
 * @access  Private (worker)
 */
const getWorkerJobs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { workerId: req.user._id };
    if (status) filter.status = status;

    const jobs = await Job.find(filter)
      .populate('customerId', 'name profileImage phone')
      .sort('-createdAt');

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a job from an accepted quotation
 * @route   POST /api/jobs/from-quotation
 * @access  Private (customer)
 */
const createJobFromQuotation = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    const Message = require('../models/Message');

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.messageType !== 'quotation') {
      return res.status(400).json({ success: false, message: 'Not a quotation message' });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (message.quotationDetails.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Quotation already accepted' });
    }

    // Create the Job
    const job = await Job.create({
      customerId: req.user._id,
      workerId: message.senderId,
      title: message.quotationDetails.title || 'Custom Job from Quotation',
      description: message.quotationDetails.description || 'Job created from an accepted quotation.',
      budget: message.quotationDetails.budget,
      status: 'accepted', // Automatically accepted since they agreed on terms
      // Calculate deadline based on delivery time/unit
      deadline: calculateDeadline(message.quotationDetails.deliveryTime, message.quotationDetails.deliveryUnit),
    });

    // Update the message status
    message.quotationDetails.status = 'accepted';
    await message.save();

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId).emit('quotation_updated', message);
    }

    const { sendNotification } = require('../utils/notificationUtil');
    await sendNotification(
      io,
      message.senderId,
      'job_accepted',
      'Quotation Accepted!',
      `${req.user.name} has accepted your quotation and a new job has been created.`,
      `/dashboard/worker/jobs`,
      { jobId: job._id }
    );

    res.status(201).json({ success: true, message: 'Job created successfully', job });
  } catch (error) {
    next(error);
  }
};

// Helper for deadline
const calculateDeadline = (time, unit) => {
  if (!time) return null;
  const date = new Date();
  if (unit === 'hours') date.setHours(date.getHours() + time);
  else if (unit === 'weeks') date.setDate(date.getDate() + time * 7);
  else date.setDate(date.getDate() + time); // default days
  return date;
};

/**
 * @desc    Worker sends a quotation for a job
 * @route   POST /api/jobs/:id/quotation
 * @access  Private (worker)
 */
const sendWorkerQuotation = async (req, res, next) => {
  try {
    const { price, availableDate, notes } = req.body;
    if (!price) return res.status(400).json({ success: false, message: 'Price is required' });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Only the assigned worker (or any worker if job has no worker) can quote
    if (job.workerId && job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to quote this job' });
    }

    // Assign this worker if not yet assigned
    if (!job.workerId) job.workerId = req.user._id;

    job.workerQuotation = {
      price: Number(price),
      availableDate: availableDate ? new Date(availableDate) : null,
      notes: notes || '',
      status: 'pending',
      sentAt: new Date(),
    };

    // Move job status to 'accepted' so it shows up properly
    job.status = 'accepted';
    await job.save();

    // Notify customer
    await Notification.create({
      userId: job.customerId,
      type: 'job_request',
      title: 'Quotation Received',
      message: `A worker has sent you a quotation for "${job.title}"`,
      link: `/dashboard/customer/jobs`,
      metadata: { jobId: job._id },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(job.customerId.toString()).emit('notification', {
        type: 'quotation_received',
        message: `New quotation for: ${job.title}`,
      });
    }

    res.json({ success: true, message: 'Quotation sent successfully', job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Customer accepts or rejects a worker quotation
 * @route   PUT /api/jobs/:id/quotation/respond
 * @access  Private (customer)
 */
const respondToWorkerQuotation = async (req, res, next) => {
  try {
    const { response } = req.body; // 'accepted' | 'rejected'
    if (!['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({ success: false, message: 'Response must be accepted or rejected' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!job.workerQuotation || !job.workerQuotation.sentAt) {
      return res.status(400).json({ success: false, message: 'No quotation to respond to' });
    }

    job.workerQuotation.status = response;
    if (response === 'accepted') {
      job.status = 'awaiting-payment';
    } else {
      job.status = 'pending';
      job.workerId = null;
      job.workerQuotation = undefined;
    }
    await job.save();

    // Notify worker
    if (job.workerId) {
      await Notification.create({
        userId: job.workerId,
        type: 'job_request',
        title: response === 'accepted' ? 'Quotation Accepted!' : 'Quotation Declined',
        message: response === 'accepted'
          ? `Your quotation for "${job.title}" was accepted. Awaiting payment from customer.`
          : `Your quotation for "${job.title}" was declined by the customer.`,
        link: `/dashboard/worker/jobs`,
        metadata: { jobId: job._id },
      });

      const io = req.app.get('io');
      if (io) {
        io.to(job.workerId.toString()).emit('notification', {
          type: 'quotation_response',
          message: response === 'accepted' ? `Quotation accepted for: ${job.title}` : `Quotation declined for: ${job.title}`,
        });
      }
    }

    res.json({ success: true, message: `Quotation ${response}`, job });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Raise a complaint for an in-progress job
 * @route   POST /api/jobs/:id/complaint
 * @access  Private (Customer)
 */
const raiseComplaint = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Complaint reason is required' });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (job.status !== 'in-progress' && job.status !== 'under-review') {
      return res.status(400).json({ success: false, message: 'Can only complain about in-progress or under-review jobs' });
    }

    job.status = 'disputed';
    job.complaintDetails = { reason, date: new Date(), attachments: [] };

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'skillmatchlk/complaints'));
      const results = await Promise.all(uploadPromises);
      job.complaintDetails.attachments = results.map((r) => r.secure_url);
    }

    await job.save();

    res.json({ success: true, message: 'Complaint raised successfully', job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin resolves a disputed job
 * @route   POST /api/jobs/admin/resolve-dispute/:id
 * @access  Private (Admin)
 */
const resolveDispute = async (req, res, next) => {
  try {
    const { action } = req.body; // 'refund' | 'release'
    if (!['refund', 'release'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'refund' or 'release'" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Job is not disputed' });
    }

    const payment = await Payment.findOne({ jobId: job._id });

    if (action === 'refund') {
      job.status = 'cancelled';
      if (payment && payment.status === 'held') {
        payment.status = 'refunded';
        await payment.save();
      }
      await Notification.create({
        userId: job.customerId,
        type: 'job_update',
        title: 'Dispute Resolved',
        message: `Your dispute for "${job.title}" was resolved in your favor. The job has been cancelled and payment refunded.`,
        link: '/dashboard/customer/jobs',
      });
      if (job.workerId) {
        await Notification.create({
          userId: job.workerId,
          type: 'job_update',
          title: 'Dispute Resolved',
          message: `The dispute for "${job.title}" was resolved in the customer's favor. The job is cancelled.`,
          link: '/dashboard/worker/jobs',
        });
      }
    } else if (action === 'release') {
      job.status = 'completed';
      if (payment && payment.status === 'held') {
        payment.status = 'released';
        payment.releasedAt = new Date();
        await payment.save();
        
        const workerProfile = await WorkerProfile.findOne({ userId: job.workerId });
        if (workerProfile) {
          workerProfile.earnings.pendingClearance -= payment.workerPayout;
          workerProfile.earnings.availableForWithdrawal += payment.workerPayout;
          workerProfile.earnings.totalEarned += payment.workerPayout;
          await workerProfile.save();
        }
      }
      await Notification.create({
        userId: job.customerId,
        type: 'job_update',
        title: 'Dispute Resolved',
        message: `Your dispute for "${job.title}" was reviewed. The admin determined the job is complete and payment has been released to the worker.`,
        link: '/dashboard/customer/jobs',
      });
      if (job.workerId) {
        await Notification.create({
          userId: job.workerId,
          type: 'payment_received',
          title: 'Dispute Resolved - Payment Released',
          message: `The dispute for "${job.title}" was resolved in your favor. Payment has been released.`,
          link: '/dashboard/worker/jobs',
        });
      }
    }

    await job.save();

    res.json({ success: true, message: `Dispute resolved and payment ${action === 'refund' ? 'refunded' : 'released'}`, job });
  } catch (error) {
    next(error);
  }
};

module.exports = { createJob, getJobs, getJobById, updateJobStatus, getCustomerJobs, getWorkerJobs, createJobFromQuotation, sendWorkerQuotation, respondToWorkerQuotation, raiseComplaint, resolveDispute };
