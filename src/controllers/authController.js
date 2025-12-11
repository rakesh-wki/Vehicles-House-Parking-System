const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  success(res, result, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  success(res, result);
});

