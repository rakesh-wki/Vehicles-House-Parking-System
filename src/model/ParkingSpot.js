const mongoose = require('mongoose');

const ParkingSpotSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String },
    address: { type: String },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' }, // [lng, lat]
    },
    capacity: { type: Number, default: 1 },
    photos: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    amenities: { type: [String], default: [] },
    description: { type: String },
    vehicleTypes: { type: [String], default: [] },
    openTime: { type: String },
    closeTime: { type: String },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    // Legacy field: kept for backward compatibility. New code should use vehicleTypes.
    vehicleType: { type: String, enum: ['car', 'bike', 'suv'] },
    priceHour: { type: Number, required: true },
    priceDay: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingSpot', ParkingSpotSchema);
