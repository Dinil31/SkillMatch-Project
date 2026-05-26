const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * @desc    Get all workers with filters
 * @route   GET /api/workers
 * @access  Public
 */
const getWorkers = async (req, res, next) => {
  try {
    const {
      category,
      location,
      minRating,
      maxRate,
      minRate,
      availability,
      search,
      page = 1,
      limit = 12,
      sort = '-averageRating',
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (availability) filter.availability = availability;
    if (minRating) filter.averageRating = { $gte: parseFloat(minRating) };
    if (maxRate || minRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = parseFloat(minRate);
      if (maxRate) filter.hourlyRate.$lte = parseFloat(maxRate);
    }
    if (location) {
      filter.$or = [
        { locationType: 'island-wide' },
        { allowedDistricts: { $regex: new RegExp(location, 'i') } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = WorkerProfile.find(filter)
      .populate('userId', 'name email profileImage isVerified status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const [workers, total] = await Promise.all([query, WorkerProfile.countDocuments(filter)]);

    // Filter out banned users
    const activeWorkers = workers.filter(
      (w) => w.userId && w.userId.status !== 'banned'
    );

    res.json({
      success: true,
      count: activeWorkers.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      workers: activeWorkers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single worker by ID
 * @route   GET /api/workers/:id
 * @access  Public
 */
const getWorkerById = async (req, res, next) => {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.params.id }).populate(
      'userId',
      'name email profileImage isVerified createdAt'
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    res.json({ success: true, worker });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create worker profile
 * @route   POST /api/workers/profile
 * @access  Private (worker)
 */
const createProfile = async (req, res, next) => {
  try {
    const existing = await WorkerProfile.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Worker profile already exists. Use PUT to update.' });
    }

    const profileData = {
      userId: req.user._id,
      ...req.body,
    };

    if (req.body.locationCoordinates) {
      try {
        profileData.locationCoordinates = JSON.parse(req.body.locationCoordinates);
      } catch (e) {
        // Ignore JSON parse error
      }
    }
    
    if (req.body.allowedDistricts) {
      try {
        profileData.allowedDistricts = JSON.parse(req.body.allowedDistricts);
      } catch (e) {
        // Ignore JSON parse error
      }
    }

    // Handle portfolio image uploads
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'skillmatchlk/portfolio')
      );
      const results = await Promise.all(uploadPromises);
      profileData.portfolio = results.map((r) => r.secure_url);
    }

    const profile = await WorkerProfile.create(profileData);

    // Update user role to worker if not already
    if (req.user.role !== 'worker') {
      await User.findByIdAndUpdate(req.user._id, { role: 'worker' });
    }

    res.status(201).json({ success: true, message: 'Worker profile created', profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update worker profile
 * @route   PUT /api/workers/profile
 * @access  Private (worker)
 */
const updateProfile = async (req, res, next) => {
  try {
    let profile = await WorkerProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    const updates = { ...req.body };

    if (req.body.locationCoordinates) {
      try {
        updates.locationCoordinates = JSON.parse(req.body.locationCoordinates);
      } catch (e) {
        // Ignore JSON parse error
      }
    }
    
    if (req.body.allowedDistricts) {
      try {
        updates.allowedDistricts = JSON.parse(req.body.allowedDistricts);
      } catch (e) {
        // Ignore JSON parse error
      }
    }

    if (req.body.retainedPortfolio) {
      try {
        const retained = JSON.parse(req.body.retainedPortfolio);
        updates.portfolio = retained;
      } catch (e) {
        updates.portfolio = profile.portfolio || [];
      }
    } else {
      updates.portfolio = profile.portfolio || [];
    }

    // Handle new portfolio uploads
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'skillmatchlk/portfolio')
      );
      const results = await Promise.all(uploadPromises);
      const newImages = results.map((r) => r.secure_url);
      updates.portfolio = [...updates.portfolio, ...newImages];
    }

    profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email profileImage');

    res.json({ success: true, message: 'Profile updated', profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete worker profile
 * @route   DELETE /api/workers/profile
 * @access  Private (worker)
 */
const deleteProfile = async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    // Delete portfolio images from Cloudinary
    if (profile.portfolio && profile.portfolio.length > 0) {
      // Extract public IDs and delete (best effort)
      try {
        const deletePromises = (profile.imagePublicIds || []).map((id) =>
          deleteFromCloudinary(id)
        );
        await Promise.all(deletePromises);
      } catch (cloudErr) {
        console.error('Cloudinary cleanup error:', cloudErr.message);
      }
    }

    await WorkerProfile.findOneAndDelete({ userId: req.user._id });

    res.json({ success: true, message: 'Worker profile deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the logged-in worker's own profile
 * @route   GET /api/workers/profile/me
 * @access  Private (worker)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email profileImage phone isVerified'
    );
    // Return empty profile shape if not yet created
    if (!profile) {
      return res.json({ success: true, profile: null });
    }
    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user's own name, phone (on User model)
 * @route   PUT /api/workers/profile/user-info
 * @access  Private (worker)
 */
const updateUserInfo = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user: { name: user.name, phone: user.phone } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/workers/profile/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkers, getWorkerById, createProfile, updateProfile, deleteProfile, getMyProfile, updateUserInfo, changePassword };
