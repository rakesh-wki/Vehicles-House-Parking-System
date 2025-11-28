const bookingService = require('../services/bookingService');


exports.startBooking = async (req, res, next) => {
try {
const booking = await bookingService.start(req.body);
res.json(booking);
} catch (err) { next(err); }
};


exports.endBooking = async (req, res, next) => {
try {
const booking = await bookingService.end(req.params.bookingId);
res.json(booking);
} catch (err) { next(err); }
};


exports.historyByMobile = async (req, res, next) => {
try {
const list = await bookingService.historyByMobile(req.query.mobile);
res.json(list);
} catch (err) { next(err); }
};


exports.ownerHistory = async (req, res, next) => {
try {
const list = await bookingService.ownerHistory(req.user._id);
res.json(list);
} catch (err) { next(err); }
};