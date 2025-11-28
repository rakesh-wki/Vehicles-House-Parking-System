const TransactionModel = require('../model/Transaction');
const BookingModel = require('../model/Booking');
const httpError = require('../utils/httpError');

exports.markPaid = async (bookingId) => {
  if (!bookingId) {
    throw httpError(400, 'bookingId is required');
  }

  const booking = await BookingModel.findById(bookingId).populate('parkingId');
  if (!booking) {
    throw httpError(404, 'Booking not found');
  }

  if (booking.status !== 'completed') {
    throw httpError(400, 'Finish booking before marking as paid');
  }

  const ownerId = booking.parkingId.ownerId;
  return TransactionModel.create({
    bookingId: booking._id,
    ownerId,
    amount: booking.totalAmount,
  });
};