const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: parseInt(process.env.OTP_EXPIRE_SECONDS || 300),
  },
});

module.exports = mongoose.model('Otp', OtpSchema);