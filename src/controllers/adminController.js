const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

// Dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  success(res, stats);
});

// User Management
exports.getAllUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  success(res, result);
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  success(res, user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body);
  success(res, user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id);
  success(res, result);
});

// Parking Management
exports.getAllParkingSpots = asyncHandler(async (req, res) => {
  const result = await adminService.getAllParkingSpots(req.query);
  success(res, result);
});

exports.deleteParkingSpot = asyncHandler(async (req, res) => {
  const result = await adminService.deleteParkingSpot(req.params.id);
  success(res, result);
});

// Booking Management
exports.getAllBookings = asyncHandler(async (req, res) => {
  const result = await adminService.getAllBookings(req.query);
  success(res, result);
});

// Transaction Management
exports.getAllTransactions = asyncHandler(async (req, res) => {
  const result = await adminService.getAllTransactions(req.query);
  success(res, result);
});

// Reports
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const result = await adminService.getRevenueReport(req.query);
  success(res, result);
});

