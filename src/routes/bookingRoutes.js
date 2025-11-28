const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Booking routes
router.post('/start', bookingCtrl.startBooking);
router.put('/end/:bookingId', bookingCtrl.endBooking);
router.get('/history', bookingCtrl.historyByMobile);
router.get('/owner-history', protect, bookingCtrl.ownerHistory);

module.exports = router;