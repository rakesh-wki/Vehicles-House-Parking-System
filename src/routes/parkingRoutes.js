const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const parkingCtrl = require('../controllers/parkingController');

router.post('/add', protect, parkingCtrl.addParking);
router.get('/my-spots', protect, parkingCtrl.mySpots);
router.put('/update/:id', protect, parkingCtrl.updateParking);
router.put('/toggle/:id', protect, parkingCtrl.toggle);
router.get('/search', parkingCtrl.search);

module.exports = router;



