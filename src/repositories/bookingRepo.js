const Booking = require('../model/Booking');

exports.create = (payload) => Booking.create(payload);
exports.findById = (id) => Booking.findById(id);
exports.findByUser = (userId) => Booking.find({ user: userId });
