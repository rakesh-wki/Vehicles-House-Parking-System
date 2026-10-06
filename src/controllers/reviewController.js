const reviewService = require('../services/reviewService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.upsertReview({
    spotId: req.body.spotId,
    rating: req.body.rating,
    comment: req.body.comment,
    userId: req.user._id,
  });
  success(res, review, 201);
});

exports.listBySpot = asyncHandler(async (req, res) => {
  const reviews = await reviewService.listBySpot(req.params.spotId);
  success(res, reviews);
});
