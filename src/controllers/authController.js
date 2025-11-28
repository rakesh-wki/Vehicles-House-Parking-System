const User = require('../model/User');
const jwt = require('jsonwebtoken');


const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  

exports.register = async (req, res) => {
const { name, email, mobile, password } = req.body;
const existing = await User.findOne({ email });
if (existing) return res.status(400).json({ message: 'Email exists' });
const user = await User.create({ name, email, mobile, password });
res.json({ token: signToken(user._id), user });
};


exports.login = async (req, res) => {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid creds' });
res.json({ token: signToken(user._id), user });
};