const User = require('../model/User');

exports.create = (payload) => User.create(payload);
exports.findByEmail = (email) => User.findOne({ email });
exports.findById = (id) => User.findById(id);
