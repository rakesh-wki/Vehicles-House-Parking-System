import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { freeSlotsOf, isPending, latLngOf } from "../lib/api";

// Fix Leaflet's default marker icons for bundlers (uses unpkg CDN images).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PIN_COLORS = {
  free: "#10b981", // emerald — slots available
  full: "#ef4444", // red — full
  pending: "#9ca3af", // grey — pending approval
};

function coloredPin(color) {
  return L.divIcon({
    className: "parkease-pin",
    html: `<div style="width:20px;height:20px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

const PIN_ICONS = Object.fromEntries(
  Object.entries(PIN_COLORS).map(([k, c]) => [k, coloredPin(c)])
);

function pinKind(spot) {
  if (isPending(spot)) return "pending";
  return freeSlotsOf(spot) > 0 ? "free" : "full";
}

function FitBounds({ spots }) {
  const map = useMap();
  useEffect(() => {
    const pts = spots.map(latLngOf).filter(Boolean);
    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    } else if (pts.length === 1) {
      map.setView(pts[0], 14);
    }
  }, [spots, map]);
  return null;
}

/**
 * Leaflet map of parking spots.
 * - green marker = free slots, red = full, grey = pending approval
 */
export default function SpotMap({
  spots = [],
  center = [26.9124, 75.7873],
  height = 420,
  onMarkerClick,
  fitToSpots = true,
}) {
  const markers = useMemo(
    () =>
      spots
        .map((s) => ({ spot: s, pos: latLngOf(s) }))
        .filter((m) => m.pos),
    [spots]
  );

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitToSpots && <FitBounds spots={spots} />}
        {markers.map(({ spot, pos }) => {
          const kind = pinKind(spot);
          return (
            <Marker
              key={spot._id}
              position={pos}
              icon={PIN_ICONS[kind]}
              eventHandlers={
                onMarkerClick
                  ? { click: () => onMarkerClick(spot) }
                  : undefined
              }
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{spot.title}</p>
                  <p className="text-slate-500">{spot.address}</p>
                  <p className="mt-1">
                    <span
                      className="mr-1 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: PIN_COLORS[kind] }}
                    />
                    {kind === "free"
                      ? `${freeSlotsOf(spot)} slot(s) free`
                      : kind === "full"
                        ? "Full"
                        : "Pending approval"}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

/** Re-center helper used by pages that need to move the map programmatically. */
export function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}
