const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const ParkingModel = require('../model/ParkingSpot');
const parkingCtrl = require('../controllers/parkingController');

// Owner-only guard for the /parking/:id alias route.
const requireSpotOwner = asyncHandler(async (req, res, next) => {
  const spot = await ParkingModel.findById(req.params.id);
  if (!spot) {
    throw httpError(404, 'Parking spot not found');
  }
  if (!spot.ownerId.equals(req.user._id)) {
    throw httpError(403, 'Not authorized. Only the spot owner can update it.');
  }
  next();
});

router.post('/add', protect, parkingCtrl.addParking);
router.get('/my-spots', protect, parkingCtrl.mySpots);
router.put('/update/:id', protect, parkingCtrl.updateParking);
router.put('/toggle/:id', protect, parkingCtrl.toggle);
router.get('/search', parkingCtrl.search);
router.get('/nearby', parkingCtrl.nearby);

// Alias: same update handler, owner-only. Declared BEFORE GET /:id.
router.put('/:id', protect, requireSpotOwner, parkingCtrl.updateParking);

router.get('/:id/availability', parkingCtrl.availability);
router.get('/:id', parkingCtrl.spotDetail);

module.exports = router;
