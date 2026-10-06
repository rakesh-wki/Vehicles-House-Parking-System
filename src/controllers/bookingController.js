const bookingService = require('../services/bookingService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.startBooking = asyncHandler(async (req, res) => {
  const { userId: _ignored, ...body } = req.body || {};
  const { booking, checkinOtp } = await bookingService.start({
    ...body,
    userId: req.user ? req.user._id : undefined,
  });
  success(res, { booking, checkinOtp }, 201);
});

exports.endBooking = asyncHandler(async (req, res) => {
  const { booking, bill } = await bookingService.end(req.params.bookingId);
  success(res, { booking, bill });
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancel(req.params.id, req.user);
  success(res, booking);
});

exports.activeBookings = asyncHandler(async (req, res) => {
  const list = await bookingService.activeByUser(req.user._id);
  success(res, list);
});

exports.historyByMobile = asyncHandler(async (req, res) => {
  const list = await bookingService.historyByMobile(req.query.mobile);
  success(res, list);
});

exports.ownerHistory = asyncHandler(async (req, res) => {
  const list = await bookingService.ownerHistory(req.user._id);
  success(res, list);
});
