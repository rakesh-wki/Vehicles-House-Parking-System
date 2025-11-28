const Transaction = require('../model/Transaction');

exports.create = (payload) => Transaction.create(payload);
exports.findByBooking = (bookingId) => Transaction.find({ booking: bookingId });
