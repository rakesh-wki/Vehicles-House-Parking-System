const OtpModel = require('../model/Otp');
const generateOTP = require('../utils/generateOTP');
const httpError = require('../utils/httpError');

exports.sendOtp = async ({ mobile }) => {
  if (!mobile) {
    throw httpError(400, 'mobile is required');
  }

  const otp = generateOTP();
  await OtpModel.create({ mobile, otp });
  // TODO: integrate SMS provider
  console.log(`OTP for ${mobile}: ${otp}`);
  return { mobile };
};

exports.verifyOtp = async ({ mobile, otp }) => {
  if (!mobile || !otp) {
    throw httpError(400, 'mobile and otp are required');
  }

  const record = await OtpModel.findOne({ mobile, otp });
  if (!record) {
    throw httpError(400, 'OTP invalid or expired');
  }

  return { mobile };
};