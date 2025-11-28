const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const parkingCtrl = require('../controllers/parkingController');

// Parking routes
router.post('/add', protect, parkingCtrl.addParking);
router.get('/my-spots', protect, parkingCtrl.mySpots);//Jo house owner login hai, usne jitne parking spots add kiye hai Un sab ko list karke return karegi.//
router.put('/update/:id', protect, parkingCtrl.updateParking);
router.put('/toggle/:id', protect, parkingCtrl.toggle);//isAvailable true/false ho jayega//
router.get('/search', parkingCtrl.search);

module.exports = router;


