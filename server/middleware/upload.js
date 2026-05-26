const multer = require('multer');
const path = require('path');

// Use memory storage so we can pipe to Cloudinary
const storage = multer.memoryStorage();

// File filter — allow only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
};

// File filter — allow images and PDFs (for certifications)
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image and PDF files are allowed'));
};

// Single image upload (e.g., profile picture)
const uploadSingleImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
}).single('image');

// Multiple images upload (e.g., gig portfolio)
const uploadMultipleImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: imageFilter,
}).array('images', 5);

// Document upload (certifications)
const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFilter,
}).single('document');

// Attachment upload (Chat)
const uploadAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFilter,
}).single('attachment');

// Multiple documents upload (Complaints)
const uploadMultipleDocuments = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB each, max 5 files
  fileFilter: documentFilter,
}).array('attachments', 5);

// Middleware wrapper with error handling
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadSingleImage: handleUpload(uploadSingleImage),
  uploadMultipleImages: handleUpload(uploadMultipleImages),
  uploadDocument: handleUpload(uploadDocument),
  uploadAttachment: handleUpload(uploadAttachment),
  uploadMultipleDocuments: handleUpload(uploadMultipleDocuments),
};
