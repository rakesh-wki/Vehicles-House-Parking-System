const Transaction = require('../model/Transaction');
const Booking = require('../model/Booking');


exports.markPaid = async (req, res) => {
const { bookingId } = req.body;
const booking = await Booking.findById(bookingId).populate('parkingId');
if (!booking) return res.status(404).json({ message: 'Booking not found' });
if (booking.status !== 'completed') return res.status(400).json({ message: 'Finish booking first' });
const ownerId = booking.parkingId.ownerId;
const tx = await Transaction.create({ bookingId: booking._id, ownerId, amount: booking.totalAmount });
res.json(tx);
};