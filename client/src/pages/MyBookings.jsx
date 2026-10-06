import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  EmptyState,
  PageHeader,
  Spinner,
  StatusBadge,
  fmtDateTime,
  fmtMoney,
} from "../components/ui";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/booking/history", {
          params: { mobile: user?.mobile },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        // Newest first.
        list.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setBookings(list);
      } catch (err) {
        setError(errMsg(err, "Could not load your bookings."));
      } finally {
        setLoading(false);
      }
    };
    if (user?.mobile) load();
    else {
      setLoading(false);
      setError("Your profile has no mobile number saved — please update it by re-logging in.");
    }
  }, [user?.mobile]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><Spinner label="Loading bookings…" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="My bookings" sub="Your parking history and active sessions." />

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!error && bookings.length === 0 && (
        <EmptyState
          title="No bookings yet"
          hint="Find a parking spot and make your first booking."
        />
      )}

      <div className="space-y-3">
        {bookings.map((b) => {
          const spotTitle =
            typeof b.parkingId === "object" ? b.parkingId?.title : "Parking spot";
          return (
            <Link
              key={b._id}
              to={`/booking/${b._id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold text-slate-900">{spotTitle}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  🚗 {b.vehicleNumber} · {fmtDateTime(b.startTime)}
                  {b.endTime ? ` → ${fmtDateTime(b.endTime)}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-extrabold text-slate-900">
                  {b.totalAmount != null ? fmtMoney(b.totalAmount) : "—"}
                </p>
                <p className="text-xs font-semibold text-indigo-600">View →</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
