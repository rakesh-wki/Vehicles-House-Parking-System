const bookingService = require('../services/bookingService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.startBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.start(req.body);
  success(res, booking, 201);
});

exports.endBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.end(req.params.bookingId);
  success(res, booking);
});

exports.historyByMobile = asyncHandler(async (req, res) => {
  const list = await bookingService.historyByMobile(req.query.mobile);
  success(res, list);
});

exports.ownerHistory = asyncHandler(async (req, res) => {
  const list = await bookingService.ownerHistory(req.user._id);
  success(res, list);
});