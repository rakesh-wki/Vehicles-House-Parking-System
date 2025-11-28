const mongoose = require('mongoose');

const ParkingSpotSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String },
    address: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    vehicleType: { type: String, enum: ['car', 'bike'], required: true },
    priceHour: { type: Number, required: true },
    priceDay: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingSpot', ParkingSpotSchema);

