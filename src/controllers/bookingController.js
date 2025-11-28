const Booking = require('../model/Booking');
const ParkingSpot = require('../model/ParkingSpot');
const calculatePrice = require('../utils/calculatePrice');


exports.startBooking = async (req, res) => {
const { mobile, name, vehicleNumber, parkingId } = req.body;
const spot = await ParkingSpot.findById(parkingId);
if (!spot || !spot.isAvailable) return res.status(400).json({ message: 'Parking not available' });
const booking = await Booking.create({ parkingId, mobile, name, vehicleNumber, startTime: new Date() });
// mark not available (optional)
spot.isAvailable = false;
await spot.save();
res.json(booking);
};


exports.endBooking = async (req, res) => {
const bookingId = req.params.bookingId;
const booking = await Booking.findById(bookingId).populate('parkingId');
if (!booking || booking.status !== 'running') return res.status(400).json({ message: 'Invalid booking' });
booking.endTime = new Date();
booking.totalAmount = calculatePrice(booking.startTime, booking.endTime, booking.parkingId.priceHour, booking.parkingId.priceDay);
booking.status = 'completed';
await booking.save();
// free spot
const spot = await ParkingSpot.findById(booking.parkingId._id);
spot.isAvailable = true;
await spot.save();
res.json(booking);
};


exports.historyByMobile = async (req, res) => {
const { mobile } = req.query;
const list = await Booking.find({ mobile }).populate('parkingId').sort({ createdAt: -1 });
res.json(list);
};


exports.ownerHistory = async (req, res) => {
const ownerId = req.user._id;
const spots = await ParkingSpot.find({ ownerId }).select('_id');
const spotIds = spots.map(s => s._id);
const list = await Booking.find({ parkingId: { $in: spotIds } }).populate('parkingId').sort({ createdAt: -1 });
res.json(list);
};