const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.post('/start', optionalProtect, bookingCtrl.startBooking);
router.put('/end/:bookingId', bookingCtrl.endBooking);
router.get('/history', bookingCtrl.historyByMobile);
router.get('/owner-history', protect, bookingCtrl.ownerHistory);
router.get('/active', protect, bookingCtrl.activeBookings);
router.put('/cancel/:id', protect, bookingCtrl.cancelBooking);

module.exports = router;
