const express = require('express');
const router = express.Router();
const { createReview, getWorkerReviews, deleteReview, getUserGivenReviews, updateReview, getUserReceivedReviews, replyToReview, toggleLikeReview, getPublicTopReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultipleImages } = require('../middleware/upload');

router.post('/', protect, authorize('customer', 'worker'), uploadMultipleImages, createReview);
router.get('/top', getPublicTopReviews);
router.get('/given', protect, getUserGivenReviews);
router.get('/received', protect, getUserReceivedReviews);
router.get('/worker/:workerId', getWorkerReviews);
router.put('/:id', protect, uploadMultipleImages, updateReview);
router.put('/:id/reply', protect, replyToReview);
router.put('/:id/like', protect, toggleLikeReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
