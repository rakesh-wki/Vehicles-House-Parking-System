const UserModel = require('../model/User');
const { signToken } = require('../utils/jwt');
const httpError = require('../utils/httpError');

exports.register = async ({ name, email, mobile, password }) => {
  if (!name || !email || !mobile || !password) {
    throw httpError(400, 'All fields are required');
  }

  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw httpError(400, 'Email already in use');
  }

  const user = await UserModel.create({ name, email, mobile, password });
  const token = signToken({ id: user._id });
  return { user, token };
};

exports.login = async ({ email, password }) => {
  if (!email || !password) {
    throw httpError(400, 'Email and password are required');
  }

  const user = await UserModel.findOne({ email });
  const invalid = !user || !(await user.matchPassword(password));
  if (invalid) {
    throw httpError(401, 'Invalid credentials');
  }

  const token = signToken({ id: user._id });
  return { user, token };
};