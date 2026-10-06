import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { errMsg } from "../lib/api";
import SpotCard from "../components/SpotCard";
import SpotMap from "../components/SpotMap";
import { Badge, EmptyState, Field, Spinner, inputCls } from "../components/ui";

const JAIPUR = [26.9124, 75.7873];
const VEHICLE_TYPES = ["car", "bike", "truck", "bus", "cycle"];
const RADII = [2, 5, 8, 15, 30];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const lat = params.get("lat");
  const lng = params.get("lng");

  const [vehicleType, setVehicleType] = useState(params.get("vehicleType") || "");
  const [radiusKm, setRadiusKm] = useState(params.get("radiusKm") || "8");
  const [maxPrice, setMaxPrice] = useState("");
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const center = useMemo(
    () =>
      lat && lng ? [parseFloat(lat), parseFloat(lng)] : JAIPUR,
    [lat, lng]
  );

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (lat && lng) {
        const q = { lat, lng, radiusKm };
        if (vehicleType) q.vehicleType = vehicleType;
        const res = await api.get("/parking/nearby", { params: q });
        data = res.data;
      } else {
        const q = {};
        if (vehicleType) q.vehicleType = vehicleType;
        const res = await api.get("/parking/search", { params: q });
        data = res.data;
      }
      setSpots(Array.isArray(data) ? data : data?.spots || []);
    } catch (err) {
      setError(errMsg(err, "Could not load parking spots."));
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusKm, vehicleType]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const applyFilters = () => {
    const next = {};
    if (lat) next.lat = lat;
    if (lng) next.lng = lng;
    if (vehicleType) next.vehicleType = vehicleType;
    if (radiusKm) next.radiusKm = radiusKm;
    setParams(next, { replace: true });
  };

  const visible = useMemo(() => {
    const mp = parseFloat(maxPrice);
    let list = spots;
    if (Number.isFinite(mp)) {
      list = list.filter((s) => Number(s.priceHour) <= mp);
    }
    return list;
  }, [spots, maxPrice]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setParams(
          {
            lat: pos.coords.latitude.toFixed(5),
            lng: pos.coords.longitude.toFixed(5),
            radiusKm,
            ...(vehicleType ? { vehicleType } : {}),
          },
          { replace: true }
        );
      },
      () => {},
      { timeout: 10000 }
    );
  };

  const onMarkerClick = (spot) => {
    // Scroll the matching card into view.
    const el = document.getElementById(`spot-card-${spot._id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Find parking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {lat && lng
              ? `Showing spots near ${lat}, ${lng}`
              : "Showing all spots — allow location or search for better results."}
          </p>
        </div>
        <button
          onClick={useMyLocation}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          📍 Use my location
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
        <Field label="Vehicle type">
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className={inputCls}
          >
            <option value="">All vehicles</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>
                {v[0].toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Search radius">
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            className={inputCls}
            disabled={!(lat && lng)}
            title={lat && lng ? "" : "Needs a location"}
          >
            {RADII.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </Field>
        <Field label="Max price / hour (₹)">
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="e.g. 50"
            inputMode="numeric"
            className={inputCls}
          />
        </Field>
        <div className="flex items-end">
          <button
            onClick={applyFilters}
            className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Apply filters
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <SpotMap spots={visible} center={center} onMarkerClick={onMarkerClick} height={520} />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Slots available
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" /> Full
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-gray-400" /> Pending approval
            </span>
          </div>
        </div>

        {/* List */}
        <div ref={listRef}>
          {loading ? (
            <Spinner label="Finding spots…" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No parking spots found"
              hint="Try a larger radius, a different vehicle type, or another location."
            />
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                <Badge tone="indigo">{visible.length} spot{visible.length === 1 ? "" : "s"}</Badge>
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {visible.map((s) => (
                  <div key={s._id} id={`spot-card-${s._id}`}>
                    <SpotCard spot={s} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
