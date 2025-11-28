const Parking = require('../model/ParkingSpot');

exports.findNearby = (query) => Parking.find(query).limit(50);
exports.findById = (id) => Parking.findById(id);
exports.update = (id, data) => Parking.findByIdAndUpdate(id, data, { new: true });
