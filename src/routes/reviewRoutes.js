const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const reviewCtrl = require('../controllers/reviewController');

router.post('/', protect, reviewCtrl.createReview);
router.get('/spot/:spotId', reviewCtrl.listBySpot);

module.exports = router;
