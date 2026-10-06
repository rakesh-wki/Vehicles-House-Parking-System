const BookingModel = require('../model/Booking');
const ParkingModel = require('../model/ParkingSpot');
const calculatePrice = require('../utils/calculatePrice');
const generateOTP = require('../utils/generateOTP');
const httpError = require('../utils/httpError');

// Keep the spot's isAvailable flag in sync: available while running bookings < capacity.
exports.syncAvailability = async (parkingId) => {
  const spot = await ParkingModel.findById(parkingId);
  if (!spot) return;
  const running = await BookingModel.countDocuments({ parkingId, status: 'running' });
  spot.isAvailable = running < (spot.capacity || 1);
  await spot.save();
};

exports.start = async ({ mobile, name, vehicleNumber, parkingId, userId }) => {
  if (!mobile || !vehicleNumber || !parkingId) {
    throw httpError(400, 'mobile, vehicleNumber and parkingId are required');
  }

  const spot = await ParkingModel.findById(parkingId);
  if (!spot) {
    throw httpError(404, 'Parking spot not found');
  }
  if (!spot.isAvailable) {
    throw httpError(400, 'Parking spot not available');
  }

  const running = await BookingModel.countDocuments({ parkingId, status: 'running' });
  if (running >= (spot.capacity || 1)) {
    throw httpError(400, 'No free slots');
  }

  const checkinOtp = generateOTP(4);
  const booking = await BookingModel.create({
    parkingId,
    mobile,
    name,
    vehicleNumber,
    startTime: new Date(),
    checkinOtp,
    otpExpires: new Date(Date.now() + 15 * 60 * 1000),
    ...(userId ? { userId } : {}),
  });

  await exports.syncAvailability(parkingId);
  return { booking, checkinOtp };
};

exports.end = async (bookingId) => {
  const booking = await BookingModel.findById(bookingId).populate('parkingId');
  if (!booking || booking.status !== 'running') {
    throw httpError(400, 'Invalid booking');
  }

  booking.endTime = new Date();
  booking.totalAmount = calculatePrice(
    booking.startTime,
    booking.endTime,
    booking.parkingId.priceHour,
    booking.parkingId.priceDay
  );
  booking.status = 'completed';
  await booking.save();

  await exports.syncAvailability(booking.parkingId._id);

  const ms = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
  const hours = Math.ceil(ms / 3600000);
  const priceHour = booking.parkingId.priceHour;
  const priceDay = booking.parkingId.priceDay;
  let days = 0;
  let totalAmount;
  if (hours < 24) {
    totalAmount = hours * priceHour;
  } else {
    days = Math.ceil(hours / 24);
    totalAmount = days * priceDay;
  }
  const bill = { hours, days, priceHour, priceDay, totalAmount };
  return { booking, bill };
};

exports.cancel = async (bookingId, requester) => {
  const booking = await BookingModel.findById(bookingId).populate('parkingId');
  if (!booking || booking.status !== 'running') {
    throw httpError(400, 'Invalid booking');
  }

  const isBookingUser = booking.userId && requester && booking.userId.equals(requester._id);
  const isSpotOwner =
    booking.parkingId &&
    booking.parkingId.ownerId &&
    requester &&
    booking.parkingId.ownerId.equals(requester._id);
  if (!isBookingUser && !isSpotOwner) {
    throw httpError(403, 'Not authorized to cancel this booking');
  }

  booking.status = 'cancelled';
  await booking.save();

  await exports.syncAvailability(booking.parkingId._id);
  return booking;
};

exports.historyByMobile = async (mobile) => {
  if (!mobile) {
    throw httpError(400, 'mobile is required');
  }

  return BookingModel.find({ mobile }).populate('parkingId').sort({ createdAt: -1 });
};

exports.ownerHistory = async (ownerId) => {
  const spots = await ParkingModel.find({ ownerId }).select('_id');
  const spotIds = spots.map((s) => s._id);
  return BookingModel.find({ parkingId: { $in: spotIds } }).populate('parkingId').sort({ createdAt: -1 });
};

exports.activeByUser = async (userId) =>
  BookingModel.find({ userId, status: 'running' }).populate('parkingId').sort({ createdAt: -1 });
