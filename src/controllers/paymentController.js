const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.markPaid = asyncHandler(async (req, res) => {
  const tx = await paymentService.markPaid(req.body.bookingId);
  success(res, tx);
});