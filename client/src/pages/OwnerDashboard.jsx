import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api, { errMsg, freeSlotsOf, latLngOf, photoUrl } from "../lib/api";
import {
  Badge,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Spinner,
  StatCard,
  StatusBadge,
  btnPrimary,
  btnSecondary,
  fmtDateTime,
  fmtMoney,
  inputCls,
} from "../components/ui";

const VEHICLE_TYPES = ["car", "bike", "truck", "bus", "cycle"];
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "spots", label: "My Spots" },
  { id: "add", label: "Add Spot" },
  { id: "bookings", label: "Bookings" },
];

function LocationPicker({ position, onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

const EMPTY_FORM = {
  title: "",
  address: "",
  capacity: 4,
  vehicleTypes: ["car"],
  priceHour: 30,
  priceDay: 200,
  amenities: "",
  description: "",
  openTime: "00:00",
  closeTime: "23:59",
  photos: [],
};

function SpotForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({ ...(initial || EMPTY_FORM) });
  const [pin, setPin] = useState(() => {
    const ll = initial ? latLngOf(initial) : null;
    return ll || [26.9124, 75.7873];
  });
  const [pinSet, setPinSet] = useState(() => !!initial);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const set = (k) => (e) => {
    const v = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const toggleVehicle = (v) => {
    setForm((f) => ({
      ...f,
      vehicleTypes: f.vehicleTypes.includes(v)
        ? f.vehicleTypes.filter((x) => x !== v)
        : [...f.vehicleTypes, v],
    }));
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("photos", f));
      const res = await api.post("/upload/photos", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Contract: { urls: ["/uploads/..."] }
      const urls = res.data?.urls || res.data || [];
      setForm((f) => ({ ...f, photos: [...(f.photos || []), ...urls] }));
    } catch (err) {
      setError(errMsg(err, "Photo upload failed."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = (u) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p !== u) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!pinSet) {
      setError("Please click on the map to place your spot's pin.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        address: form.address.trim(),
        location: { lat: pin[0], lng: pin[1] },
        capacity: Number(form.capacity),
        vehicleTypes: form.vehicleTypes,
        priceHour: Number(form.priceHour),
        priceDay: Number(form.priceDay),
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        photos: form.photos,
        description: form.description.trim(),
        openTime: form.openTime,
        closeTime: form.closeTime,
      };
      if (initial?._id) {
        await api.put(`/parking/update/${initial._id}`, payload);
      } else {
        await api.post("/parking/add", payload);
      }
      onSaved();
    } catch (err) {
      setError(errMsg(err, "Could not save the spot."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Spot title">
          <input required value={form.title} onChange={set("title")} className={inputCls} placeholder="e.g. Sharma Residence Parking" />
        </Field>
        <Field label="Address">
          <input required value={form.address} onChange={set("address")} className={inputCls} placeholder="Full address" />
        </Field>
      </div>

      <Field label="Pick location — click on the map to place the pin">
        <div className="overflow-hidden rounded-xl border border-slate-300" style={{ height: 280 }}>
          <MapContainer center={pin} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker
              position={pinSet ? pin : null}
              onPick={(p) => {
                setPin(p);
                setPinSet(true);
              }}
            />
          </MapContainer>
        </div>
        {pinSet && (
          <span className="mt-1 block text-xs text-slate-500">
            Pin: {pin[0].toFixed(5)}, {pin[1].toFixed(5)}
          </span>
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Capacity (vehicles)">
          <input type="number" min={1} required value={form.capacity} onChange={set("capacity")} className={inputCls} />
        </Field>
        <Field label="Price / hour (₹)">
          <input type="number" min={0} required value={form.priceHour} onChange={set("priceHour")} className={inputCls} />
        </Field>
        <Field label="Price / day (₹)">
          <input type="number" min={0} required value={form.priceDay} onChange={set("priceDay")} className={inputCls} />
        </Field>
      </div>

      <Field label="Vehicle types allowed">
        <div className="flex flex-wrap gap-2">
          {VEHICLE_TYPES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggleVehicle(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                form.vehicleTypes.includes(v)
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Open time">
          <input type="time" value={form.openTime} onChange={set("openTime")} className={inputCls} />
        </Field>
        <Field label="Close time">
          <input type="time" value={form.closeTime} onChange={set("closeTime")} className={inputCls} />
        </Field>
      </div>

      <Field label="Amenities (comma separated)">
        <input value={form.amenities} onChange={set("amenities")} className={inputCls} placeholder="CCTV, Covered, EV charging, Guard" />
      </Field>

      <Field label="Description">
        <textarea rows={3} value={form.description} onChange={set("description")} className={inputCls} placeholder="Anything drivers should know…" />
      </Field>

      <Field label="Photos">
        <div>
          {(form.photos || []).length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {form.photos.map((u) => (
                <div key={u} className="relative h-20 w-28 overflow-hidden rounded-lg border border-slate-200">
                  <img src={photoUrl(u)} alt="spot" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(u)}
                    className="absolute right-1 top-1 rounded-full bg-slate-900/70 px-1.5 text-xs text-white"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="text-sm" />
          {uploading && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
        </div>
      </Field>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy || uploading} className={btnPrimary}>
          {busy ? "Saving…" : initial?._id ? "Save changes" : "Add spot"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function OwnerDashboard() {
  const [tab, setTab] = useState("overview");
  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // spot being edited
  const [toggling, setToggling] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sRes, bRes] = await Promise.all([
        api.get("/parking/my-spots"),
        api.get("/booking/owner-history").catch(() => ({ data: [] })),
      ]);
      setSpots(Array.isArray(sRes.data) ? sRes.data : sRes.data?.spots || []);
      setBookings(Array.isArray(bRes.data) ? bRes.data : bRes.data?.bookings || []);
    } catch (err) {
      setError(errMsg(err, "Could not load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = bookings.filter(
      (b) =>
        String(b.status).toLowerCase() === "completed" &&
        b.endTime &&
        new Date(b.endTime) >= monthStart
    );
    const earnings = completedThisMonth.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
    const totalCapacity = spots.reduce((s, sp) => s + (Number(sp.capacity) || 0), 0);
    const activeBookings = bookings.filter((b) =>
      ["running", "active", "ongoing"].includes(String(b.status).toLowerCase())
    ).length;
    const occupancy = totalCapacity > 0 ? Math.round((activeBookings / totalCapacity) * 100) : 0;
    const activeSpots = spots.filter((sp) => sp.isAvailable !== false).length;
    return { earnings, occupancy, activeSpots, totalSpots: spots.length, activeBookings, completedThisMonth: completedThisMonth.length };
  }, [spots, bookings]);

  const toggleSpot = async (spot) => {
    setToggling(spot._id);
    try {
      const res = await api.put(`/parking/toggle/${spot._id}`);
      const updated = res.data?.spot || res.data;
      setSpots((prev) =>
        prev.map((s) => (s._id === spot._id ? { ...s, ...(typeof updated === "object" ? updated : {}), isAvailable: updated?.isAvailable ?? !s.isAvailable } : s))
      );
    } catch (err) {
      alert(errMsg(err, "Could not toggle availability."));
    } finally {
      setToggling("");
    }
  };

  const onSaved = () => {
    setEditing(null);
    setTab("spots");
    load();
  };

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><Spinner label="Loading dashboard…" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader title="Owner dashboard" sub="Manage your parking spots, bookings and earnings." />

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Earnings this month" value={fmtMoney(stats.earnings)} sub={`${stats.completedThisMonth} completed bookings`} icon="💰" />
            <StatCard label="Occupancy" value={`${stats.occupancy}%`} sub={`${stats.activeBookings} vehicles parked now`} icon="🅿️" />
            <StatCard label="Active spots" value={`${stats.activeSpots}/${stats.totalSpots}`} sub="Accepting bookings" icon="📍" />
            <StatCard label="Total bookings" value={bookings.length} sub="Across all your spots" icon="🧾" />
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Recent bookings</h2>
            <RecentBookings bookings={bookings.slice(0, 5)} />
          </div>
        </>
      )}

      {tab === "spots" && (
        <div>
          {spots.length === 0 ? (
            <EmptyState title="No spots yet" hint="Add your first parking spot to start earning." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Spot</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Free</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map((s) => (
                    <tr key={s._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <Link to={`/spot/${s._id}`} className="font-bold text-indigo-700 hover:underline">
                          {s.title}
                        </Link>
                        <p className="max-w-[240px] truncate text-xs text-slate-500">{s.address}</p>
                      </td>
                      <td className="px-4 py-3">{s.capacity ?? "—"}</td>
                      <td className="px-4 py-3">{freeSlotsOf(s)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {fmtMoney(s.priceHour)}/hr · {fmtMoney(s.priceDay)}/day
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={s.status} />
                          <Badge tone={s.isAvailable === false ? "red" : "green"}>
                            {s.isAvailable === false ? "Paused" : "Accepting"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(s)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleSpot(s)}
                            disabled={toggling === s._id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                              s.isAvailable === false ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"
                            } disabled:opacity-60`}
                          >
                            {toggling === s._id ? "…" : s.isAvailable === false ? "Resume" : "Pause"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "add" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Add a new parking spot</h2>
          <SpotForm onSaved={onSaved} />
        </div>
      )}

      {tab === "bookings" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Bookings at my spots</h2>
          {bookings.length === 0 ? (
            <EmptyState title="No bookings yet" hint="Bookings for your spots will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Spot</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {typeof b.parkingId === "object" ? b.parkingId?.title : b.parkingId || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {b.name}
                        <p className="text-xs text-slate-500">{b.mobile}</p>
                      </td>
                      <td className="px-4 py-3">{b.vehicleNumber}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(b.startTime)}</td>
                      <td className="px-4 py-3 font-bold">{b.totalAmount != null ? fmtMoney(b.totalAmount) : "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit spot">
        {editing && (
          <SpotForm
            initial={{
              ...editing,
              amenities: Array.isArray(editing.amenities) ? editing.amenities.join(", ") : editing.amenities || "",
            }}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function RecentBookings({ bookings }) {
  if (bookings.length === 0)
    return <p className="mt-2 text-sm text-slate-400">No bookings yet.</p>;
  return (
    <ul className="mt-3 divide-y divide-slate-100">
      {bookings.map((b) => (
        <li key={b._id} className="flex items-center justify-between py-2 text-sm">
          <div>
            <p className="font-semibold text-slate-900">
              {b.vehicleNumber} <span className="font-normal text-slate-500">· {b.name}</span>
            </p>
            <p className="text-xs text-slate-500">{fmtDateTime(b.startTime)}</p>
          </div>
          <StatusBadge status={b.status} />
        </li>
      ))}
    </ul>
  );
}
