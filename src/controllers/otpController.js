const otpService = require('../services/otpService');


exports.sendOtp = async (req, res, next) => {
try {
const out = await otpService.sendOtp(req.body);
res.json({ message: 'OTP sent (demo)', ...out });
} catch (err) { next(err); }
};


exports.verifyOtp = async (req, res, next) => {
try {
const out = await otpService.verifyOtp(req.body);
res.json({ message: 'Verified', ...out });
} catch (err) { next(err); }
};