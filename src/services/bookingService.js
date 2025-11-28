const BookingModel = require('../model/Booking');
const ParkingModel = require('../model/ParkingSpot');
const calculatePrice = require('../utils/calculatePrice');


exports.start = async ({ mobile, name, vehicleNumber, parkingId }) => {
const spot = await ParkingModel.findById(parkingId);
if (!spot || !spot.isAvailable) throw { status: 400, message: 'Parking not available' };
const booking = await BookingModel.create({ parkingId, mobile, name, vehicleNumber, startTime: new Date() });
spot.isAvailable = false;
await spot.save();
return booking;
};


exports.end = async (bookingId) => {
const booking = await BookingModel.findById(bookingId).populate('parkingId');
if (!booking || booking.status !== 'running') throw { status: 400, message: 'Invalid booking' };
booking.endTime = new Date();
booking.totalAmount = calculatePrice(booking.startTime, booking.endTime, booking.parkingId.priceHour, booking.parkingId.priceDay);
booking.status = 'completed';
await booking.save();
const spot = await ParkingModel.findById(booking.parkingId._id);
spot.isAvailable = true;
await spot.save();
return booking;
};


exports.historyByMobile = async (mobile) => {
return await BookingModel.find({ mobile }).populate('parkingId').sort({ createdAt: -1 });
};


exports.ownerHistory = async (ownerId) => {
const spots = await ParkingModel.find({ ownerId }).select('_id');
const spotIds = spots.map(s => s._id);
return await BookingModel.find({ parkingId: { $in: spotIds } }).populate('parkingId').sort({ createdAt: -1 });
};