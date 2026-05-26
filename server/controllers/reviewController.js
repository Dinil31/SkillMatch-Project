const Review = require('../models/Review');
const Job = require('../models/Job');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private (customer)
 */
const createReview = async (req, res, next) => {
  try {
    const { jobId, workerId, rating, comment, direction = 'customer_to_worker' } = req.body;

    // Verify job exists and is completed
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed jobs' });
    }

    if (direction === 'customer_to_worker' && job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this job' });
    }
    if (direction === 'worker_to_customer' && job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this job' });
    }

    // Check if review already exists for this direction
    const existingReview = await Review.findOne({ jobId, direction });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this job' });
    }

    const customerId = job.customerId;

    const reviewData = {
      customerId,
      workerId: job.workerId,
      jobId,
      rating,
      comment,
      direction,
      images: [],
    };

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'skillmatchlk/reviews'));
      const results = await Promise.all(uploadPromises);
      reviewData.images = results.map((r) => r.secure_url);
    }

    const review = await Review.create(reviewData);

    if (direction === 'customer_to_worker') {
        job.isReviewed = true;
    } else if (direction === 'worker_to_customer') {
        job.workerReviewed = true;
    }
    await job.save();

    res.status(201).json({ success: true, review });
  } catch (error) {
    require('fs').appendFileSync('review_error.log', new Date().toISOString() + ': ' + error.stack + '\n');
    next(error);
  }
};

/**
 * @desc    Get all reviews for a worker
 * @route   GET /api/reviews/worker/:workerId
 * @access  Public
 */
const getWorkerReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ workerId: req.params.workerId, isVisible: true })
        .populate('customerId', 'name profileImage')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ workerId: req.params.workerId, isVisible: true }),
    ]);

    // Calculate rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { workerId: require('mongoose').Types.ObjectId.createFromHexString(req.params.workerId), isVisible: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach((s) => {
      distribution[s._id] = s.count;
    });

    res.json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      ratingDistribution: distribution,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (customer who wrote it or admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isOwner = (review.direction === 'customer_to_worker' ? review.customerId.toString() : review.workerId.toString()) === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);

    // Reset job reviewed status
    await Job.findByIdAndUpdate(review.jobId, { isReviewed: false });

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews given by the logged in user
 * @route   GET /api/reviews/given
 * @access  Private
 */
const getUserGivenReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user._id;

    // A user can be a customer or a worker, so we look for reviews they wrote
    const query = {
      $or: [
        { customerId: userId, direction: 'customer_to_worker' },
        { workerId: userId, direction: 'worker_to_customer' }
      ],
      isVisible: true
    };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('workerId', 'name profileImage')
        .populate('customerId', 'name profileImage')
        .populate('jobId', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isOwner = (review.direction === 'customer_to_worker' ? review.customerId.toString() : review.workerId.toString()) === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    const { rating, comment, existingImages } = req.body;
    let images = [];
    
    // Parse existing images if passed
    if (existingImages) {
        images = Array.isArray(existingImages) ? existingImages : [existingImages];
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'skillmatchlk/reviews'));
      const results = await Promise.all(uploadPromises);
      images = [...images, ...results.map((r) => r.secure_url)];
    }

    // Limit to 5 images total
    if (images.length > 5) {
        return res.status(400).json({ success: false, message: 'Cannot exceed 5 images' });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    review.images = images;
    review.isEdited = true;

    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews received by the logged in user
 * @route   GET /api/reviews/received
 * @access  Private
 */
const getUserReceivedReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user._id;

    // We look for reviews directed to this user
    const query = {
      $or: [
        { workerId: userId, direction: 'customer_to_worker' },
        { customerId: userId, direction: 'worker_to_customer' }
      ],
      isVisible: true
    };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('workerId', 'name profileImage')
        .populate('customerId', 'name profileImage')
        .populate('jobId', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reply to a review
 * @route   PUT /api/reviews/:id/reply
 * @access  Private (receiver only)
 */
const replyToReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isReceiver = (review.direction === 'customer_to_worker' ? review.workerId.toString() : review.customerId.toString()) === req.user._id.toString();

    if (!isReceiver) {
      return res.status(403).json({ success: false, message: 'Only the receiver can reply to this review' });
    }

    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    review.reply = {
      text: text.trim(),
      createdAt: new Date()
    };

    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle like on a review
 * @route   PUT /api/reviews/:id/like
 * @access  Private
 */
const toggleLikeReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const userId = req.user._id;
    const isLiked = review.likes && review.likes.includes(userId);

    if (isLiked) {
      review.likes = review.likes.filter(id => id.toString() !== userId.toString());
    } else {
      if (!review.likes) review.likes = [];
      review.likes.push(userId);
    }

    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top public reviews for homepage
 * @route   GET /api/reviews/top
 * @access  Public
 */
const getPublicTopReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      rating: 5,
      direction: 'customer_to_worker',
      isVisible: true,
    })
      .populate('customerId', 'name profileImage')
      .populate('workerId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getWorkerReviews, deleteReview, getUserGivenReviews, updateReview, getUserReceivedReviews, replyToReview, toggleLikeReview, getPublicTopReviews };
