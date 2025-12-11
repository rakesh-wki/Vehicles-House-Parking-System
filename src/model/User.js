const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const UserSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
// email: { type: String, unique: true, sparse: true },
// password: { type: String },
mobile: { type: String, required: true },
// mobile: { type: String, required: true, unique: true },
role: { type: String, enum: ['admin', 'houseOwner', 'customer'], default: 'customer' },
isActive: { type: Boolean, default: true },
}, { timestamps: true });


UserSchema.pre('save', async function (next) {
if (!this.isModified('password')) return next();
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
next();
});


UserSchema.methods.matchPassword = async function (entered) {
return await bcrypt.compare(entered, this.password);
};


module.exports = mongoose.model('User', UserSchema);