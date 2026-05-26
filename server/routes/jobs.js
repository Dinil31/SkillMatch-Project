const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJobStatus,
  getCustomerJobs,
  getWorkerJobs,
  createJobFromQuotation,
  sendWorkerQuotation,
  respondToWorkerQuotation,
  raiseComplaint,
  resolveDispute,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultipleDocuments } = require('../middleware/upload');

// Specific routes before parameterized routes
router.get('/customer/my-jobs', protect, authorize('customer', 'admin'), getCustomerJobs);
router.get('/worker/my-jobs', protect, authorize('worker', 'admin'), getWorkerJobs);
router.post('/from-quotation', protect, authorize('customer'), createJobFromQuotation);
router.post('/admin/resolve-dispute/:id', protect, authorize('admin'), resolveDispute);

router.post('/', protect, authorize('customer'), createJob);
router.get('/', protect, authorize('admin'), getJobs);
router.get('/:id', protect, getJobById);
router.put('/:id/status', protect, updateJobStatus);
router.post('/:id/quotation', protect, authorize('worker'), sendWorkerQuotation);
router.put('/:id/quotation/respond', protect, authorize('customer'), respondToWorkerQuotation);
router.post('/:id/complaint', protect, authorize('customer'), uploadMultipleDocuments, raiseComplaint);

module.exports = router;
