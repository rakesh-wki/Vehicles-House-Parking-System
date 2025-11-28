const parkingService = require('../services/parkingService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.addParking = asyncHandler(async (req, res) => {
  const spot = await parkingService.create(req.user._id, req.body);
  success(res, spot, 201);
});

exports.updateParking = asyncHandler(async (req, res) => {
  const updated = await parkingService.update(req.params.id, req.body);
  success(res, updated);
});

exports.toggle = asyncHandler(async (req, res) => {
  const spot = await parkingService.toggle(req.params.id);
  success(res, spot);
});

exports.mySpots = asyncHandler(async (req, res) => {
  const spots = await parkingService.mySpots(req.user._id);
  success(res, spots);
});

exports.search = asyncHandler(async (req, res) => {
  const spots = await parkingService.searchNearby(req.query);
  success(res, spots);
});