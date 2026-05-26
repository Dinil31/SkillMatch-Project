const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Job = require('../models/Job');
const Gig = require('../models/Gig');
const Review = require('../models/Review');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ban or unban a user
 * @route   PUT /api/admin/users/:id/ban
 * @access  Private (admin)
 */
const banUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot ban an admin user' });
    }

    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    user.status = newStatus;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully`,
      user: { _id: user._id, name: user.name, email: user.email, status: user.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify a worker
 * @route   PUT /api/admin/workers/:id/verify
 * @access  Private (admin)
 */
const verifyWorker = async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.params.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    profile.isVerified = !profile.isVerified;
    await profile.save();

    // Also update user's isVerified
    await User.findByIdAndUpdate(req.params.id, { isVerified: profile.isVerified });

    res.json({
      success: true,
      message: `Worker ${profile.isVerified ? 'verified' : 'unverified'} successfully`,
      isVerified: profile.isVerified,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform reports (flagged content, etc.)
 * @route   GET /api/admin/reports
 * @access  Private (admin)
 */
const getReports = async (req, res, next) => {
  try {
    // Get recently banned users
    const bannedUsers = await User.find({ status: 'banned' })
      .select('name email status createdAt')
      .sort('-updatedAt')
      .limit(10);

    // Get unverified workers
    const unverifiedWorkers = await WorkerProfile.find({ isVerified: false })
      .populate('userId', 'name email createdAt')
      .sort('-createdAt')
      .limit(10);

    // Get cancelled jobs
    const cancelledJobs = await Job.find({ status: 'cancelled' })
      .populate('customerId', 'name')
      .populate('workerId', 'name')
      .sort('-updatedAt')
      .limit(10);

    res.json({
      success: true,
      reports: {
        bannedUsers,
        unverifiedWorkers,
        cancelledJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalWorkers,
      totalCustomers,
      totalJobs,
      completedJobs,
      totalGigs,
      totalReviews,
      recentUsers,
      jobsByStatus,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ role: 'customer' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'completed' }),
      Gig.countDocuments({ isActive: true }),
      Review.countDocuments(),
      User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
      Job.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate total platform revenue (sum of completed job budgets)
    const revenueResult = await Job.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$budget' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Monthly job trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyJobs = await Job.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const statusMap = {};
    jobsByStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalWorkers,
        totalCustomers,
        totalJobs,
        completedJobs,
        totalGigs,
        totalReviews,
        totalRevenue,
        jobsByStatus: statusMap,
        monthlyJobs,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, banUser, verifyWorker, getReports, getDashboardStats };

/**
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete an admin' });

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      WorkerProfile.findOneAndDelete({ userId: req.params.id }),
      Job.deleteMany({ $or: [{ customerId: req.params.id }, { workerId: req.params.id }] }),
      Gig.deleteMany({ workerId: req.params.id }),
      Review.deleteMany({ $or: [{ customerId: req.params.id }, { workerId: req.params.id }] }),
    ]);

    res.json({ success: true, message: 'User and all associated data deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews (admin moderation)
 * @route   GET /api/admin/reviews
 * @access  Private (admin)
 */
const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.comment = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('customerId', 'name email profileImage')
        .populate('workerId', 'name email profileImage')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(filter),
    ]);

    res.json({ success: true, count: reviews.length, total, pages: Math.ceil(total / parseInt(limit)), reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/admin/reviews/:id
 * @access  Private (admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the main support agent (admin)
 * @route   GET /api/admin/support-agent
 * @access  Private
 */
const getSupportAgent = async (req, res, next) => {
  try {
    // Find the first admin user
    const admin = await User.findOne({ role: 'admin' }).select('_id name profileImage');
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Support agent not found' });
    }
    
    res.json({ success: true, agent: admin });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, banUser, deleteUser, verifyWorker, getReports, getDashboardStats, getReviews, deleteReview, getSupportAgent };
