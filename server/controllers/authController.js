const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({ name, email, password, role: role || 'customer', phone: phone || '' });

    // Generate email verification token and OTP
    const verificationToken = user.generateEmailVerificationToken();
    const otp = user.generateEmailOtp();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to SkillMatch.lk — Verify Your Email',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h2 style="color:#1e293b;margin:0;">🇱🇰 SkillMatch.lk</h2>
            </div>
            <div style="background:white;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
              <h3 style="color:#1e293b;margin-top:0;">Welcome, ${user.name}!</h3>
              <p style="color:#64748b;">Please verify your email address. You can click the link below or enter the 6-digit code in your dashboard:</p>
              
              <div style="text-align:center;margin:24px 0;">
                <a href="${verifyUrl}" style="background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-bottom:16px;">Verify Email via Link</a>
                
                <p style="color:#64748b;margin:16px 0 8px;">OR enter this verification code:</p>
                <div style="background:#f1f5f9;border-radius:8px;padding:16px;display:inline-block;">
                  <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#3B82F6;">${otp}</span>
                </div>
              </div>
              
              <p style="color:#64748b;font-size:13px;">⏱ This link expires in 24 hours. The code expires in 10 minutes.</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      // Don't fail registration if email fails
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if banned
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Your account has been banned. Contact support.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password — send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found (security best practice)
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'SkillMatch.lk — Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your SkillMatch.lk account.</p>
          <a href="${resetUrl}" style="background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
          <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        `,
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({ success: true, message: 'Password reset successful', token });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    user.emailOtp = undefined;
    user.emailOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend Verification Email (Link & OTP)
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email is already verified' });

    const verificationToken = user.generateEmailVerificationToken();
    const otp = user.generateEmailOtp();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'SkillMatch.lk — Email Verification Code',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h2 style="color:#1e293b;margin:0;">🇱🇰 SkillMatch.lk</h2>
            </div>
            <div style="background:white;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
              <h3 style="color:#1e293b;margin-top:0;">Email Verification</h3>
              <p style="color:#64748b;">Please verify your email address. You can click the link below or enter the 6-digit code in your dashboard:</p>
              
              <div style="text-align:center;margin:24px 0;">
                <a href="${verifyUrl}" style="background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-bottom:16px;">Verify Email via Link</a>
                
                <p style="color:#64748b;margin:16px 0 8px;">OR enter this verification code:</p>
                <div style="background:#f1f5f9;border-radius:8px;padding:16px;display:inline-block;">
                  <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#3B82F6;">${otp}</span>
                </div>
              </div>
              
              <p style="color:#64748b;font-size:13px;">⏱ This link expires in 24 hours. The code expires in 10 minutes.</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      return res.status(500).json({ success: false, message: 'Failed to send verification email' });
    }

    res.json({ success: true, message: `Verification email sent to ${user.email}.` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email OTP
 * @route   POST /api/auth/verify-email-otp
 * @access  Private
 */
const verifyEmailOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      _id: req.user._id,
      emailOtp: hashedOtp,
      emailOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpire = undefined;
    // Also clear the link token
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Switch user role (between customer and worker)
 * @route   PUT /api/auth/switch-role
 * @access  Private
 */
const switchRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['customer', 'worker'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admins cannot switch roles' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Switched to ${role === 'worker' ? 'Selling' : 'Buying'} mode`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile image
 * @route   PUT /api/auth/profile-image
 * @access  Private
 */
const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

    // Find user to check if they already have an image
    const user = await User.findById(req.user._id);

    // Delete existing image if it exists
    if (user.profileImagePublicId) {
      await deleteFromCloudinary(user.profileImagePublicId);
    }

    // Upload new image
    const result = await uploadToCloudinary(req.file.buffer, 'skillmatchlk/avatars');

    // Update user
    user.profileImage = result.secure_url;
    user.profileImagePublicId = result.public_id;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/me
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const WorkerProfile = require('../models/WorkerProfile');
    
    // Delete worker profile if exists
    await WorkerProfile.findOneAndDelete({ userId: req.user._id });

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail, verifyEmailOtp, switchRole, updateProfileImage, deleteAccount };
