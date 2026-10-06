const ReviewModel = require('../model/Review');
const httpError = require('../utils/httpError');

exports.upsertReview = async ({ spotId, userId, rating, comment }) => {
  if (!spotId || !userId || rating === undefined) {
    throw httpError(400, 'spotId, rating are required');
  }

  let review = await ReviewModel.findOne({ spotId, userId });
  if (review) {
    review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save(); // triggers post-save hook to recompute spot rating
    return review;
  }

  review = await ReviewModel.create({ spotId, userId, rating, comment });
  return review;
};

exports.listBySpot = (spotId) =>
  ReviewModel.find({ spotId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
