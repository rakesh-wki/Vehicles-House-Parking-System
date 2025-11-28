const Otp = require('../model/Otp');
const generateOTP = require('../utils/generateOTP');


exports.sendOtp = async (req, res) => {
const { mobile } = req.body;
if (!mobile) return res.status(400).json({ message: 'Mobile required' });
const otp = generateOTP();
await Otp.create({ mobile, otp });
// TODO: Integrate SMS provider
console.log(`OTP for ${mobile} is ${otp}`);
res.json({ message: 'OTP sent (demo)', mobile });
};


exports.verifyOtp = async (req, res) => {
const { mobile, otp } = req.body;
const rec = await Otp.findOne({ mobile, otp });
if (!rec) return res.status(400).json({ message: 'OTP invalid or expired' });
// OTP valid - return a short lived token (or just success)
res.json({ message: 'Verified', mobile });
};