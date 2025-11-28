const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

exports.signToken = (payload, opts = {}) => jwt.sign(payload, JWT_SECRET, Object.assign({ expiresIn: '7d' }, opts));

exports.verifyToken = (token) => jwt.verify(token, JWT_SECRET);
