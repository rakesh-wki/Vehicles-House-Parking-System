const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    spotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

ReviewSchema.index({ spotId: 1, userId: 1 }, { unique: true });

// Recompute avgRating + ratingCount on the spot whenever a review is saved.
ReviewSchema.post('save', async function () {
  try {
    const ParkingSpot = mongoose.model('ParkingSpot');
    const stats = await this.constructor.aggregate([
      { $match: { spotId: this.spotId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await ParkingSpot.findByIdAndUpdate(this.spotId, {
      avgRating: stats[0] ? stats[0].avg : 0,
      ratingCount: stats[0] ? stats[0].count : 0,
    });
  } catch (err) {
    console.error('Failed to recompute spot rating:', err.message);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
