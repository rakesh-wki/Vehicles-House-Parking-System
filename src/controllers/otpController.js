const otpService = require('../services/otpService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.sendOtp = asyncHandler(async (req, res) => {
  const payload = await otpService.sendOtp(req.body);
  success(res, payload, 201);
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const payload = await otpService.verifyOtp(req.body);
  success(res, payload);
});