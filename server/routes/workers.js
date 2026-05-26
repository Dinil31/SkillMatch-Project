const express = require('express');
const router = express.Router();
const {
  getWorkers,
  getWorkerById,
  createProfile,
  updateProfile,
  deleteProfile,
  getMyProfile,
  updateUserInfo,
  changePassword,
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultipleImages } = require('../middleware/upload');

// Public routes
router.get('/', getWorkers);
router.get('/:id', getWorkerById);

// Authenticated worker routes — specific paths BEFORE /:id
router.get('/profile/me', protect, authorize('worker', 'admin'), getMyProfile);
router.post('/profile', protect, authorize('worker', 'admin'), uploadMultipleImages, createProfile);
router.put('/profile', protect, authorize('worker', 'admin'), uploadMultipleImages, updateProfile);
router.put('/profile/user-info', protect, updateUserInfo);
router.put('/profile/change-password', protect, changePassword);
router.delete('/profile', protect, authorize('worker', 'admin'), deleteProfile);

module.exports = router;
