const ParkingModel = require('../model/ParkingSpot');
const httpError = require('../utils/httpError');

exports.create = async (ownerId, payload) => {
  const required = ['vehicleType', 'priceHour', 'priceDay'];
  const missing = required.filter((field) => payload[field] === undefined);
  if (missing.length) {
    throw httpError(400, `Missing fields: ${missing.join(', ')}`);
  }

  return ParkingModel.create({ ...payload, ownerId });
};

exports.update = async (id, payload) => {
  const updated = await ParkingModel.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw httpError(404, 'Parking spot not found');
  }
  return updated;
};

exports.toggle = async (id) => {
  const spot = await ParkingModel.findById(id);
  if (!spot) {
    throw httpError(404, 'Parking spot not found');
  }
  spot.isAvailable = !spot.isAvailable;
  await spot.save();
  return spot;
};

exports.mySpots = (ownerId) => ParkingModel.find({ ownerId });

exports.searchNearby = async ({ lat, lng, vehicleType, limit = 20 }) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    throw httpError(400, 'lat and lng must be valid numbers');
  }

  const query = { isAvailable: true };
  if (vehicleType) {
    query.vehicleType = vehicleType;
  }

  const spots = await ParkingModel.find(query);
  const withDist = spots.map((spot) => {
    const dLat = (spot.location?.lat || 0) - latNum;
    const dLng = (spot.location?.lng || 0) - lngNum;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return { spot, dist };
  });

  withDist.sort((a, b) => a.dist - b.dist);
  return withDist.slice(0, limit).map((entry) => entry.spot);
};