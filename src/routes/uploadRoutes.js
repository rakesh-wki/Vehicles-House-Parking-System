const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { success } = require('../utils/response');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  cb(httpError(400, 'Only image files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Roles allowed to upload: houseOwner or admin.
const allowUploader = (req, res, next) => {
  if (!req.user) return next(httpError(401, 'Not authenticated'));
  if (req.user.role === 'houseOwner' || req.user.role === 'admin') return next();
  return next(httpError(403, 'Only house owners and admins can upload photos'));
};

router.post(
  '/photos',
  protect,
  allowUploader,
  upload.array('photos', 8),
  asyncHandler(async (req, res) => {
    const urls = (req.files || []).map((f) => `/uploads/${f.filename}`);
    success(res, { urls }, 201);
  })
);

module.exports = router;
