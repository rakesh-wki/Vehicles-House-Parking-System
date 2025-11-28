const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/paymentController');

// Payment routes
router.post('/mark-paid', paymentCtrl.markPaid);

module.exports = router;


