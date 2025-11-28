const BookingModel = require('../model/Booking');
const ParkingModel = require('../model/ParkingSpot');
const calculatePrice = require('../utils/calculatePrice');
const httpError = require('../utils/httpError');

exports.start = async ({ mobile, name, vehicleNumber, parkingId }) => {
  if (!mobile || !vehicleNumber || !parkingId) {
    throw httpError(400, 'mobile, vehicleNumber and parkingId are required');
  }

  const spot = await ParkingModel.findById(parkingId);
  if (!spot || !spot.isAvailable) {
    throw httpError(400, 'Parking spot not available');
  }

  const booking = await BookingModel.create({
    parkingId,
    mobile,
    name,
    vehicleNumber,
    startTime: new Date(),
  });

  spot.isAvailable = false;
  await spot.save();
  return booking;
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

  const spot = await ParkingModel.findById(booking.parkingId._id);
  spot.isAvailable = true;
  await spot.save();
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