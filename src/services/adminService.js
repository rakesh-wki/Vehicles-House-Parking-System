const UserModel = require('../model/User');
const ParkingModel = require('../model/ParkingSpot');
const BookingModel = require('../model/Booking');
const TransactionModel = require('../model/Transaction');
const httpError = require('../utils/httpError');

// Dashboard Stats
exports.getDashboardStats = async () => {
  const [
    totalUsers,
    totalOwners,
    totalCustomers,
    totalSpots,
    activeSpots,
    totalBookings,
    runningBookings,
    totalTransactions,
    totalRevenue,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: 'houseOwner' }),
    UserModel.countDocuments({ role: 'customer' }),
    ParkingModel.countDocuments(),
    ParkingModel.countDocuments({ isAvailable: true }),
    BookingModel.countDocuments(),
    BookingModel.countDocuments({ status: 'running' }),
    TransactionModel.countDocuments(),
    TransactionModel.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
  ]);

  return {
    users: { total: totalUsers, owners: totalOwners, customers: totalCustomers },
    parking: { total: totalSpots, active: activeSpots },
    bookings: { total: totalBookings, running: runningBookings },
    revenue: { total: totalRevenue, transactions: totalTransactions },
  };
};

// User Management
exports.getAllUsers = async ({ role, isActive, page = 1, limit = 10 }) => {
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    UserModel.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserModel.countDocuments(query),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
};

exports.getUserById = async (userId) => {
  const user = await UserModel.findById(userId).select('-password');
  if (!user) {
    throw httpError(404, 'User not found');
  }
  return user;
};

exports.updateUser = async (userId, updates) => {
  const allowedUpdates = ['name', 'email', 'mobile', 'role', 'isActive'];
  const updateData = {};
  Object.keys(updates).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = updates[key];
    }
  });

  const user = await UserModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
  if (!user) {
    throw httpError(404, 'User not found');
  }
  return user;
};

exports.deleteUser = async (userId) => {
  const user = await UserModel.findByIdAndDelete(userId);
  if (!user) {
    throw httpError(404, 'User not found');
  }
  return { message: 'User deleted successfully' };
};

// Parking Management
exports.getAllParkingSpots = async ({ vehicleType, isAvailable, page = 1, limit = 10 }) => {
  const query = {};
  if (vehicleType) query.vehicleType = vehicleType;
  if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

  const skip = (page - 1) * limit;
  const [spots, total] = await Promise.all([
    ParkingModel.find(query).populate('ownerId', 'name email mobile').sort({ createdAt: -1 }).skip(skip).limit(limit),
    ParkingModel.countDocuments(query),
  ]);

  return { spots, total, page, limit, pages: Math.ceil(total / limit) };
};

exports.deleteParkingSpot = async (spotId) => {
  const spot = await ParkingModel.findByIdAndDelete(spotId);
  if (!spot) {
    throw httpError(404, 'Parking spot not found');
  }
  return { message: 'Parking spot deleted successfully' };
};

// Booking Management
exports.getAllBookings = async ({ status, page = 1, limit = 10 }) => {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    BookingModel.find(query)
      .populate('parkingId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BookingModel.countDocuments(query),
  ]);

  return { bookings, total, page, limit, pages: Math.ceil(total / limit) };
};

// Transaction Management
exports.getAllTransactions = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    TransactionModel.find()
      .populate('bookingId')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TransactionModel.countDocuments(),
  ]);

  return { transactions, total, page, limit, pages: Math.ceil(total / limit) };
};

// Reports
exports.getRevenueReport = async ({ startDate, endDate }) => {
  const query = {};
  if (startDate || endDate) {
    query.paidAt = {};
    if (startDate) query.paidAt.$gte = new Date(startDate);
    if (endDate) query.paidAt.$lte = new Date(endDate);
  }

  const transactions = await TransactionModel.find(query);
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    totalRevenue,
    transactionCount: transactions.length,
    transactions,
  };
};

