const mongoose = require('mongoose');


const BookingSchema = new mongoose.Schema({
parkingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
mobile: { type: String, required: true },
name: { type: String },
vehicleNumber: { type: String, required: true },
startTime: { type: Date, default: Date.now },
endTime: { type: Date },
totalAmount: { type: Number, default: 0 },
checkinOtp: { type: String },
otpExpires: { type: Date },
status: { type: String, enum: ['running', 'completed', 'cancelled'], default: 'running' }
}, { timestamps: true });


module.exports = mongoose.model('Booking', BookingSchema);
