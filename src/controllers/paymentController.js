const paymentService = require('../services/paymentService');


exports.markPaid = async (req, res, next) => {
try {
const tx = await paymentService.markPaid(req.body.bookingId);
res.json(tx);
} catch (err) { next(err); }
};