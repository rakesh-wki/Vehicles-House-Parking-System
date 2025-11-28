const mongoose = require('mongoose');


const BookingSchema = new mongoose.Schema({
parkingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
mobile: { type: String, required: true },
name: { type: String },
vehicleNumber: { type: String, required: true },
startTime: { type: Date, default: Date.now },
endTime: { type: Date },
totalAmount: { type: Number, default: 0 },
status: { type: String, enum: ['running', 'completed'], default: 'running' }
}, { timestamps: true });


module.exports = mongoose.model('Booking', BookingSchema);