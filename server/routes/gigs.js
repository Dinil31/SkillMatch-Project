const express = require('express');
const router = express.Router();
const {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  getWorkerGigs,
  getAdminGigs,
  updateGigStatus,
} = require('../controllers/gigController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultipleImages } = require('../middleware/upload');

// Must be before /:id to avoid conflict
router.get('/worker/my-gigs', protect, authorize('worker'), getWorkerGigs);
router.get('/admin/all', protect, authorize('admin'), getAdminGigs);

router.get('/', getGigs);
router.post('/', protect, authorize('worker'), uploadMultipleImages, createGig);
router.get('/:id', getGigById);
router.put('/:id', protect, authorize('worker', 'admin'), uploadMultipleImages, updateGig);
router.put('/:id/status', protect, authorize('admin'), updateGigStatus);
router.delete('/:id', protect, authorize('worker', 'admin'), deleteGig);

module.exports = router;
