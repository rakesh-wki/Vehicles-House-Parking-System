const parkingService = require('../services/parkingService');


exports.addParking = async (req, res, next) => {
try {
const spot = await parkingService.create(req.user._id, req.body);
res.json(spot);
} catch (err) { next(err); }
};


exports.updateParking = async (req, res, next) => {
try {
const updated = await parkingService.update(req.params.id, req.body);
res.json(updated);
} catch (err) { next(err); }
};


exports.toggle = async (req, res, next) => {
try {
const spot = await parkingService.toggle(req.params.id);
res.json(spot);
} catch (err) { next(err); }
};


exports.mySpots = async (req, res, next) => {
try {
const spots = await parkingService.mySpots(req.user._id);
res.json(spots);
} catch (err) { next(err); }
};


exports.search = async (req, res, next) => {
try {
const result = await parkingService.searchNearby(req.query);
res.json(result);
} catch (err) { next(err); }
};

