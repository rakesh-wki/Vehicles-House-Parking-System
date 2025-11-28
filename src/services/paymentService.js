const TransactionModel = require('../model/Transaction');
const BookingModel = require('../model/Booking');


exports.markPaid = async (bookingId) => {
const booking = await BookingModel.findById(bookingId).populate('parkingId');
if (!booking) throw { status: 404, message: 'Booking not found' };
if (booking.status !== 'completed') throw { status: 400, message: 'Finish booking first' };
const ownerId = booking.parkingId.ownerId;
const tx = await TransactionModel.create({ bookingId: booking._id, ownerId, amount: booking.totalAmount });
return tx;
};