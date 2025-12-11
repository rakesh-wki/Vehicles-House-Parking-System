const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

exports.isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw httpError(401, 'Not authenticated');
  }

  if (req.user.role !== 'admin') {
    throw httpError(403, 'Access denied. Admin only.');
  }

  next();
});

