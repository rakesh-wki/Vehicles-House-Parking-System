const authService = require('../services/authService');


exports.register = async (req, res, next) => {
try {
const { user, token } = await authService.register(req.body);
res.status(201).json({ token, user });
} catch (err) {
console.log('Register error:', err);
next(err);
}
};


exports.login = async (req, res, next) => {
try {
const { user, token } = await authService.login(req.body);
res.json({ token, user });
} catch (err) {
console.log('Login error:', err);
next(err);
}
};