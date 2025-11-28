const ParkingModel = require('../model/ParkingSpot');


exports.create = async (ownerId, payload) => {
payload.ownerId = ownerId;
return await ParkingModel.create(payload);
};


exports.update = async (id, payload) => {
return await ParkingModel.findByIdAndUpdate(id, payload, { new: true });
};


exports.toggle = async (id) => {
const spot = await ParkingModel.findById(id);
if (!spot) throw { status: 404, message: 'Not found' };
spot.isAvailable = !spot.isAvailable;
await spot.save();
return spot;
};


exports.mySpots = async (ownerId) => {
return await ParkingModel.find({ ownerId });
};


exports.searchNearby = async ({ lat, lng, vehicleType, limit = 20 }) => {
if (!lat || !lng) throw { status: 400, message: 'lat & lng required' };
const spots = await ParkingModel.find({ vehicleType, isAvailable: true });
const withDist = spots.map(s => {
const dLat = s.location.lat - parseFloat(lat);
const dLng = s.location.lng - parseFloat(lng);
const dist = Math.sqrt(dLat * dLat + dLng * dLng);
return { spot: s, dist };
});
withDist.sort((a, b) => a.dist - b.dist);
return withDist.slice(0, limit).map(w => w.spot);
};