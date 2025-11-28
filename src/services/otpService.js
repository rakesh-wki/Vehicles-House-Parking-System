const OtpModel = require('../model/Otp');
const generateOTP = require('../utils/generateOTP');
// Optionally integrate SMS provider here


exports.sendOtp = async ({ mobile }) => {
if (!mobile) throw { status: 400, message: 'Mobile required' };
const otp = generateOTP();
await OtpModel.create({ mobile, otp });
// TODO: send via SMS provider
console.log(`OTP for ${mobile}: ${otp}`);
return { mobile };
};


exports.verifyOtp = async ({ mobile, otp }) => {
const rec = await OtpModel.findOne({ mobile, otp });
if (!rec) throw { status: 400, message: 'OTP invalid or expired' };
return { mobile };
};