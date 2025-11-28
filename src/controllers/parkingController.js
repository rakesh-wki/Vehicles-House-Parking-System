const ParkingSpot = require('../model/ParkingSpot');


exports.addParking = async (req, res) => {
const ownerId = req.user._id;
const body = req.body;
body.ownerId = ownerId;
const spot = await ParkingSpot.create(body);
res.json(spot);
};


exports.updateParking = async (req, res) => {
const updated = await ParkingSpot.findByIdAndUpdate(req.params.id, req.body, { new: true });
res.json(updated);
};


exports.toggle = async (req, res) => {
const spot = await ParkingSpot.findById(req.params.id);
if (!spot) return res.status(404).json({ message: 'Not found' });
spot.isAvailable = !spot.isAvailable;
await spot.save();
res.json(spot);
};


exports.mySpots = async (req, res) => {
const spots = await ParkingSpot.find({ ownerId: req.user._id });
res.json(spots);
};


exports.search = async (req, res) => {
const { lat, lng, vehicleType } = req.query;
if (!lat || !lng) return res.status(400).json({ message: 'lat & lng required' });
// simple distance calc (not geospatial index) - returns nearest 20
const spots = await ParkingSpot.find({ vehicleType, isAvailable: true });
const withDist = spots.map(s => {
const dLat = s.location.lat - parseFloat(lat);
const dLng = s.location.lng - parseFloat(lng);
const dist = Math.sqrt(dLat * dLat + dLng * dLng);
return { spot: s, dist };
});
withDist.sort((a, b) => a.dist - b.dist);
res.json(withDist.slice(0, 20).map(w => w.spot));
};