const Gig = require('../models/Gig');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new gig
 * @route   POST /api/gigs
 * @access  Private (worker)
 */
const createGig = async (req, res, next) => {
  try {
    const gigData = {
      workerId: req.user._id,
      ...req.body,
    };

    if (gigData.tags && typeof gigData.tags === 'string') {
      try { gigData.tags = JSON.parse(gigData.tags); } catch { gigData.tags = gigData.tags.split(','); }
    }
    if (gigData.allowedDistricts && typeof gigData.allowedDistricts === 'string') {
      try { gigData.allowedDistricts = JSON.parse(gigData.allowedDistricts); } catch (e) {}
    }
    if (gigData.locationCoordinates && typeof gigData.locationCoordinates === 'string') {
      try { gigData.locationCoordinates = JSON.parse(gigData.locationCoordinates); } catch (e) {}
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'skillmatchlk/gigs')
      );
      const results = await Promise.all(uploadPromises);
      gigData.images = results.map((r) => r.secure_url);
      gigData.imagePublicIds = results.map((r) => r.public_id);
    }

    const gig = await Gig.create(gigData);
    await gig.populate('workerId', 'name profileImage');

    res.status(201).json({ success: true, message: 'Gig created successfully', gig });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all gigs with filters
 * @route   GET /api/gigs
 * @access  Public
 */
const getGigs = async (req, res, next) => {
  try {
    const {
      category, minPrice, maxPrice, search, locationType, districts, lat, lng, radius,
      page = 1, limit = 12, sort = '-createdAt',
    } = req.query;

    const filter = { isActive: true, approvalStatus: 'approved' };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    if (locationType) {
      if (locationType === 'remote') {
        filter.locationType = 'remote';
      } else if (locationType === 'island-wide') {
        filter.locationType = { $in: ['island-wide', 'remote'] }; 
      } else if (locationType === 'districts' && districts) {
        const distArray = districts.split(',');
        filter.$or = [
          { locationType: 'island-wide' },
          { locationType: 'remote' },
          { locationType: 'districts', allowedDistricts: { $in: distArray } }
        ];
      } else if (locationType === 'radius' && lat && lng) {
        const radiusInKm = radius ? parseFloat(radius) : 10;
        filter.$or = [
          { locationType: 'island-wide' },
          { locationType: 'remote' },
          {
            locationCoordinates: {
              $geoWithin: {
                $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInKm / 6378.1]
              }
            }
          }
        ];
      }
    }

    let sortQuery = {};
    switch (sort) {
      case 'rating': sortQuery = { workerRating: -1, workerReviewsCount: -1, createdAt: -1 }; break;
      case 'price_asc': sortQuery = { price: 1 }; break;
      case 'price_desc': sortQuery = { price: -1 }; break;
      case 'newest':
      default: sortQuery = { createdAt: -1 }; break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [gigs, total] = await Promise.all([
      Gig.find(filter).populate('workerId', 'name profileImage').sort(sortQuery).skip(skip).limit(parseInt(limit)),
      Gig.countDocuments(filter),
    ]);

    res.json({ success: true, count: gigs.length, total, pages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), gigs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single gig by ID
 * @route   GET /api/gigs/:id
 * @access  Public
 */
const getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('workerId', 'name profileImage email');
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
    await Gig.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a gig
 * @route   PUT /api/gigs/:id
 * @access  Private (worker — owner only)
 */
const updateGig = async (req, res, next) => {
  try {
    let gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
    if (gig.workerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized to update this gig' });

    const updates = { ...req.body };

    if (updates.tags && typeof updates.tags === 'string') {
      try { updates.tags = JSON.parse(updates.tags); } catch { updates.tags = updates.tags.split(','); }
    }
    if (updates.allowedDistricts && typeof updates.allowedDistricts === 'string') {
      try { updates.allowedDistricts = JSON.parse(updates.allowedDistricts); } catch (e) {}
    }
    if (updates.locationCoordinates && typeof updates.locationCoordinates === 'string') {
      try { updates.locationCoordinates = JSON.parse(updates.locationCoordinates); } catch (e) {}
    }

    if (req.files && req.files.length > 0) {
      if (gig.imagePublicIds && gig.imagePublicIds.length > 0) {
        await Promise.all(gig.imagePublicIds.map((id) => deleteFromCloudinary(id)));
      }
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'skillmatchlk/gigs'));
      const results = await Promise.all(uploadPromises);
      updates.images = results.map((r) => r.secure_url);
      updates.imagePublicIds = results.map((r) => r.public_id);
    }

    gig = await Gig.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('workerId', 'name profileImage');
    res.json({ success: true, message: 'Gig updated', gig });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a gig
 * @route   DELETE /api/gigs/:id
 * @access  Private (worker — owner only)
 */
const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
    if (gig.workerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this gig' });
    }
    if (gig.imagePublicIds && gig.imagePublicIds.length > 0) {
      await Promise.all(gig.imagePublicIds.map((id) => deleteFromCloudinary(id)));
    }
    await Gig.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gig deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get gigs by the logged-in worker
 * @route   GET /api/gigs/worker/my-gigs
 * @access  Private (worker)
 */
const getWorkerGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ workerId: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: gigs.length, gigs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all gigs (Admin)
 * @route   GET /api/gigs/admin/all
 * @access  Private (admin)
 */
const getAdminGigs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.approvalStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [gigs, total] = await Promise.all([
      Gig.find(filter)
        .populate('workerId', 'name email profileImage isVerified')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Gig.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: gigs.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      gigs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update gig approval status
 * @route   PUT /api/gigs/:id/status
 * @access  Private (admin)
 */
const updateGigStatus = async (req, res, next) => {
  try {
    const { approvalStatus, rejectionReason } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const updateData = { approvalStatus };
    if (approvalStatus === 'rejected') {
      updateData.rejectionReason = rejectionReason || 'Your gig was rejected by the admin.';
    } else {
      updateData.rejectionReason = null;
    }
    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
    res.json({ success: true, message: `Gig marked as ${approvalStatus}`, gig });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  getWorkerGigs,
  getAdminGigs,
  updateGigStatus,
};
