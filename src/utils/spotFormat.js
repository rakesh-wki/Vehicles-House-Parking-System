// Helpers for reading parking-spot location across old and new schemas.
// Old docs: location = { lat, lng }. New docs: location = { type: 'Point', coordinates: [lng, lat] }.

exports.getLatLng = (spot) => {
  const loc = spot && spot.location;
  if (!loc) return null;
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
    const lng = Number(loc.coordinates[0]);
    const lat = Number(loc.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
};

// Convert an incoming location payload ({lat,lng} or GeoJSON) into GeoJSON { type:'Point', coordinates:[lng,lat] }.
exports.toGeoJSON = (input) => {
  if (!input || typeof input !== 'object') return undefined;
  if (typeof input.lat === 'number' && typeof input.lng === 'number') {
    return { type: 'Point', coordinates: [input.lng, input.lat] };
  }
  if (input.type === 'Point' && Array.isArray(input.coordinates) && input.coordinates.length >= 2) {
    const lng = Number(input.coordinates[0]);
    const lat = Number(input.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { type: 'Point', coordinates: [lng, lat] };
    }
  }
  return undefined;
};

// Derive vehicleTypes from the legacy vehicleType field when vehicleTypes is absent/empty.
exports.withVehicleTypes = (payload) => {
  const next = { ...payload };
  if ((!next.vehicleTypes || next.vehicleTypes.length === 0) && next.vehicleType) {
    next.vehicleTypes = [next.vehicleType];
  }
  return next;
};

// Normalize a spot (mongoose doc or plain object) for API output:
// always expose GeoJSON location plus lat/lng, and fill vehicleTypes from legacy vehicleType.
exports.formatSpot = (spot) => {
  const obj = spot && typeof spot.toObject === 'function' ? spot.toObject() : { ...spot };
  const ll = exports.getLatLng(obj);
  if (ll) {
    obj.location = { type: 'Point', coordinates: [ll.lng, ll.lat] };
    obj.lat = ll.lat;
    obj.lng = ll.lng;
  }
  return exports.withVehicleTypes(obj);
};
