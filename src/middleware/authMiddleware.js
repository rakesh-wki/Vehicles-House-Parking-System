const User = require('../model/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { verifyToken } = require('../utils/jwt');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) {
    throw httpError(401, 'Not authenticated');
  }

  const decoded = verifyToken(token);
  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw httpError(401, 'User not found');
  }

  req.user = user;
next();
});