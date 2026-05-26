const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Existing payment routes
router.post('/initiate', protect, authorize('customer'), initiatePayment);
router.post('/confirm', protect, authorize('customer'), confirmPayment);
router.post('/:jobId/release', protect, authorize('customer'), releasePayment);
router.post('/:jobId/refund', protect, authorize('admin'), refundPayment);
router.get('/wallet', protect, authorize('worker'), getWallet);
router.get('/revenue', protect, authorize('admin'), getRevenue);

// Bank details (worker)
router.post('/bank-details', protect, authorize('worker'), saveBankDetails);
router.get('/bank-details', protect, authorize('worker'), getBankDetails);

// Withdrawal requests (worker)
router.post('/withdraw', protect, authorize('worker'), requestWithdrawal);
router.get('/withdraw', protect, authorize('worker'), getMyWithdrawals);

// Withdrawal management (admin)
router.get('/withdrawals', protect, authorize('admin'), getAllWithdrawals);
router.put('/withdrawals/:id/process', protect, authorize('admin'), processWithdrawal);

module.exports = router;
