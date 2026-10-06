import axios from "axios";

/** Base URL of the backend (no /api prefix on the backend). */
export const API_BASE = "http://localhost:5001";

const api = axios.create({ baseURL: API_BASE });

// Attach Bearer JWT when available.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("parkease_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap the backend envelope: { success: true, data: <payload> }.
api.interceptors.response.use(
  (res) => {
    const d = res.data;
    if (d && typeof d === "object" && d.success === true && "data" in d) {
      res.data = d.data;
    }
    return res;
  },
  (err) => Promise.reject(err)
);

/**
 * Resolve a photo URL from the backend.
 * - Full http(s) URLs (e.g. picsum seed photos) are returned as-is.
 * - Relative "/uploads/..." paths are prefixed with the backend origin.
 */
export function photoUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_BASE}${u.startsWith("/") ? u : `/${u}`}`;
}

/**
 * Backend stores coordinates as GeoJSON [lng, lat] — flip to [lat, lng] for Leaflet.
 */
export function latLngOf(spot) {
  const c = spot?.location?.coordinates;
  if (!c || c.length < 2 || c[0] == null || c[1] == null) return null;
  return [Number(c[1]), Number(c[0])];
}

/** Free slots, falling back to capacity when the field is absent. */
export function freeSlotsOf(spot) {
  if (spot == null) return 0;
  if (typeof spot.freeSlots === "number") return spot.freeSlots;
  return typeof spot.capacity === "number" ? spot.capacity : 0;
}

export function isPending(spot) {
  return String(spot?.status || "").toLowerCase() === "pending";
}

/** Extract a human-readable message from an axios error. */
export function errMsg(err, fallback = "Something went wrong") {
  const d = err?.response?.data;
  if (d) {
    if (typeof d === "string") return d;
    if (d.message) return d.message;
    if (d.error) return String(d.error);
  }
  return err?.message || fallback;
}

export default api;
