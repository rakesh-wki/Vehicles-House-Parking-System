const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register-house-owner', register);
router.post('/login-house-owner', login);

// Generic contract endpoints used by the SPA frontend
router.post('/register', register);
router.post('/login', login);


module.exports = router;