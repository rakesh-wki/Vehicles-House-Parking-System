const UserModel = require('../model/User');

const jwt = require('jsonwebtoken');


const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });


exports.register = async ({ name, email, mobile, password }) => {
const existing = await UserModel.findOne({ email });
if (existing) throw { status: 400, message: 'Email exists' };
const user = await UserModel.create({ name, email, mobile, password });
const token = signToken(user._id);
return { user, token };
};


exports.login = async ({ email, password }) => {
const user = await UserModel.findOne({ email });
if (!user || !(await user.matchPassword(password))) throw { status: 401, message: 'Invalid creds' };
const token = signToken(user._id);
return { user, token };
};