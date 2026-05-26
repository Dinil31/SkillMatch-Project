const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  verifyEmailOtp,
  switchRole,
  updateProfileImage,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'worker']).withMessage('Role must be customer or worker'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/forgot-password', body('email').isEmail(), forgotPassword);
router.put('/reset-password/:token', body('password').isLength({ min: 6 }), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerificationEmail);
router.post('/verify-email-otp', protect, body('otp').isLength({ min: 6, max: 6 }), verifyEmailOtp);
router.put('/switch-role', protect, body('role').isIn(['customer', 'worker']), switchRole);
router.put('/profile-image', protect, uploadSingleImage, updateProfileImage);
router.delete('/me', protect, deleteAccount);

module.exports = router;
