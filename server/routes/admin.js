const express = require('express');
const router = express.Router();
const {
  getUsers,
  banUser,
  deleteUser,
  verifyWorker,
  getReports,
  getDashboardStats,
  getReviews,
  deleteReview,
  getSupportAgent,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Route for any authenticated user to get a support agent
router.get('/support-agent', protect, getSupportAgent);

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);
router.put('/workers/:id/verify', verifyWorker);
router.get('/reports', getReports);
router.get('/stats', getDashboardStats);
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
