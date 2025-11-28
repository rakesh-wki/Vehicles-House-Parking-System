const mongoose = require('mongoose');


const TransactionSchema = new mongoose.Schema({
bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
amount: { type: Number, required: true },
paidAt: { type: Date, default: Date.now }
}, { timestamps: true });


module.exports = mongoose.model('Transaction', TransactionSchema);



