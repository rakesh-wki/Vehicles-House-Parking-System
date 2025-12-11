const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register-house-owner', register);
router.post('/login-house-owner', login);


module.exports = router;