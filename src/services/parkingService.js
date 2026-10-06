const ParkingModel = require('../model/ParkingSpot');
const BookingModel = require('../model/Booking');
const httpError = require('../utils/httpError');
const { toGeoJSON, formatSpot, withVehicleTypes } = require('../utils/spotFormat');

exports.create = async (ownerId, payload) => {
  const required = ['vehicleType', 'priceHour', 'priceDay'];
  const missing = required.filter((field) => payload[field] === undefined);
  if (missing.length) {
    throw httpError(400, `Missing fields: ${missing.join(', ')}`);
  }

  const data = withVehicleTypes({ ...payload, ownerId });
  const geo = toGeoJSON(payload.location);
  if (geo) data.location = geo;

  return ParkingModel.create(data);
};

exports.update = async (id, payload) => {
  const data = withVehicleTypes({ ...payload });
  if (payload.location !== undefined) {
    const geo = toGeoJSON(payload.location);
    if (geo) data.location = geo;
  }
  const updated = await ParkingModel.findByIdAndUpdate(id, data, { new: true });
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

// Number of running bookings for a spot.
exports.countRunning = (spotId) =>
  BookingModel.countDocuments({ parkingId: spotId, status: 'running' });

// Live free slots for a spot.
exports.getFreeSlots = async (spotId) => {
  const spot = await ParkingModel.findById(spotId);
  if (!spot) {
    throw httpError(404, 'Parking spot not found');
  }
  const activeBookings = await exports.countRunning(spotId);
  const capacity = spot.capacity || 1;
  return { capacity, activeBookings, freeSlots: Math.max(capacity - activeBookings, 0) };
};

// Keep isAvailable in sync with capacity vs running bookings.
exports.syncAvailability = async (spotId) => {
  const { freeSlots } = await exports.getFreeSlots(spotId);
  await ParkingModel.findByIdAndUpdate(spotId, { isAvailable: freeSlots > 0 });
};

// Spot detail enriched for public output.
exports.getById = async (id) => {
  const spot = await ParkingModel.findById(id).populate('ownerId', 'name email mobile');
  if (!spot) {
    throw httpError(404, 'Parking spot not found');
  }
  const { freeSlots } = await exports.getFreeSlots(id);
  return { ...formatSpot(spot), freeSlots };
};

// Geo $near search for approved, available spots.
exports.findNearby = async ({ lat, lng, radiusKm = 8, vehicleType, limit = 20 }) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    throw httpError(400, 'lat and lng are required and must be valid numbers');
  }

  const query = {
    status: 'approved',
    isAvailable: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
        $maxDistance: parseFloat(radiusKm) * 1000,
      },
    },
  };
  if (vehicleType) {
    query.$or = [{ vehicleTypes: vehicleType }, { vehicleType }];
  }

  const spots = await ParkingModel.find(query).limit(parseInt(limit, 10) || 20);
  const enriched = await Promise.all(
    spots.map(async (spot) => {
      const { freeSlots } = await exports.getFreeSlots(spot._id);
      return { ...formatSpot(spot), freeSlots };
    })
  );
  return enriched;
};

exports.searchNearby = async ({ lat, lng, vehicleType, limit = 20 }) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    throw httpError(400, 'lat and lng must be valid numbers');
  }

  const query = { isAvailable: true, status: 'approved' };
  if (vehicleType) {
    query.$or = [{ vehicleTypes: vehicleType }, { vehicleType }];
  }

  const spots = await ParkingModel.find(query);
  const withDist = spots.map((spot) => {
    const ll = require('../utils/spotFormat').getLatLng(spot);
    const dLat = (ll ? ll.lat : 0) - latNum;
    const dLng = (ll ? ll.lng : 0) - lngNum;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return { spot, dist };
  });

  withDist.sort((a, b) => a.dist - b.dist);
  const sliced = withDist.slice(0, limit).map((entry) => entry.spot);
  return Promise.all(
    sliced.map(async (spot) => {
      const { freeSlots } = await exports.getFreeSlots(spot._id);
      return { ...formatSpot(spot), freeSlots };
    })
  );
};
