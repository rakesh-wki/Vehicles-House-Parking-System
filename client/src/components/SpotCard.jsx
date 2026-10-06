import { Link } from "react-router-dom";
import { freeSlotsOf, isPending, photoUrl } from "../lib/api";
import { Badge, fmtMoney } from "./ui";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#10b981"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><text x="400" y="225" font-family="sans-serif" font-size="44" fill="white" text-anchor="middle" opacity="0.9">🅿️ ParkEase</text></svg>`
  );

export default function SpotCard({ spot }) {
  const free = freeSlotsOf(spot);
  const pending = isPending(spot);
  const img = photoUrl(spot?.photos?.[0]) || PLACEHOLDER;

  return (
    <Link
      to={`/spot/${spot._id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={img}
          alt={spot.title}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {pending ? (
            <Badge tone="amber">Pending approval</Badge>
          ) : free > 0 ? (
            <Badge tone="green">{free} slot{free === 1 ? "" : "s"} free</Badge>
          ) : (
            <Badge tone="red">Full</Badge>
          )}
        </div>
        {typeof spot.avgRating === "number" && spot.avgRating > 0 && (
          <div className="absolute right-3 top-3">
            <Badge tone="indigo">★ {spot.avgRating.toFixed(1)}</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-base font-bold text-slate-900">{spot.title}</h3>
        <p className="mt-0.5 truncate text-sm text-slate-500">{spot.address}</p>
        {(spot.vehicleTypes || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {spot.vehicleTypes.slice(0, 4).map((v) => (
              <Badge key={v} tone="slate">
                {v}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-extrabold text-slate-900">
              {fmtMoney(spot.priceHour)}
              <span className="text-xs font-medium text-slate-500"> /hour</span>
            </p>
            <p className="text-xs text-slate-500">
              {fmtMoney(spot.priceDay)} /day
            </p>
          </div>
          <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
