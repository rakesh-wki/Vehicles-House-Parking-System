import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { errMsg, photoUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  EmptyState,
  Modal,
  Spinner,
  StatusBadge,
  btnPrimary,
  btnSecondary,
  fmtDateTime,
  fmtMoney,
} from "../components/ui";

const isRunning = (b) =>
  ["running", "active", "ongoing"].includes(String(b?.status || "").toLowerCase());

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** Estimated bill: ceil to hours; >=24h bills by whole days. */
export function estimateBill(startTime, priceHour, priceDay) {
  const elapsedMs = Math.max(0, Date.now() - new Date(startTime).getTime());
  const hours = Math.max(1, Math.ceil(elapsedMs / 3600000));
  if (hours < 24) {
    return { hours, days: 0, total: hours * (priceHour || 0), unit: `${hours} hr` };
  }
  const days = Math.ceil(hours / 24);
  return { hours, days, total: days * (priceDay || 0), unit: `${days} day${days > 1 ? "s" : ""}` };
}

export default function BookingDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthed } = useAuth();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [spot, setSpot] = useState(location.state?.spot || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const [bill, setBill] = useState(null); // final bill after ending
  const [ending, setEnding] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [actionError, setActionError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const findBooking = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1) Active bookings (protected).
      try {
        const res = await api.get("/booking/active");
        const list = Array.isArray(res.data) ? res.data : [];
        const found = list.find((b) => String(b._id) === String(id));
        if (found) {
          setBooking(found);
          return;
        }
      } catch {
        /* fall through to history */
      }
      // 2) History by the logged-in user's mobile.
      if (user?.mobile) {
        const res = await api.get("/booking/history", { params: { mobile: user.mobile } });
        const list = Array.isArray(res.data) ? res.data : [];
        const found = list.find((b) => String(b._id) === String(id));
        if (found) {
          setBooking(found);
          return;
        }
      }
      setError("Booking not found.");
    } catch (err) {
      setError(errMsg(err, "Could not load booking."));
    } finally {
      setLoading(false);
    }
  }, [id, user?.mobile]);

  useEffect(() => {
    if (!booking) findBooking();
  }, [booking, findBooking]);

  // Resolve spot pricing: parkingId may be populated or just an id.
  useEffect(() => {
    const pid = booking?.parkingId;
    if (!pid) return;
    if (typeof pid === "object" && pid.priceHour != null) {
      setSpot((prev) => prev || pid);
      return;
    }
    const pidStr = typeof pid === "object" ? pid._id : pid;
    if (!pidStr) return;
    api
      .get(`/parking/${pidStr}`)
      .then((res) => setSpot(res.data?.spot || res.data))
      .catch(() => {});
  }, [booking]);

  // Live timer, every second.
  useEffect(() => {
    if (!booking || !isRunning(booking)) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [booking]);

  const est = useMemo(() => {
    if (!booking || !spot) return null;
    return estimateBill(booking.startTime, spot.priceHour, spot.priceDay);
  }, [booking, spot, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const endParking = async () => {
    setActionError("");
    setEnding(true);
    try {
      const res = await api.put(`/booking/end/${id}`);
      // Contract: { booking, bill }
      setBooking(res.data?.booking || res.data);
      setBill(res.data?.bill || null);
    } catch (err) {
      setActionError(errMsg(err, "Could not end parking."));
    } finally {
      setEnding(false);
    }
  };

  const payNow = async () => {
    setActionError("");
    setPaying(true);
    try {
      await api.post("/payment/mark-paid", { bookingId: id });
      setPaid(true);
      setPayOpen(false);
    } catch (err) {
      setActionError(errMsg(err, "Payment failed."));
    } finally {
      setPaying(false);
    }
  };

  const cancelBooking = async () => {
    if (!window.confirm("Cancel this booking?")) return;
    setActionError("");
    setCancelling(true);
    try {
      const res = await api.put(`/booking/cancel/${id}`);
      setBooking(res.data?.booking || res.data);
    } catch (err) {
      setActionError(errMsg(err, "Could not cancel booking."));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><Spinner label="Loading booking…" /></div>;
  if (error || !booking)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Booking not found" hint={error || ""} />
        <div className="mt-4 text-center">
          <Link to="/my-bookings" className="font-semibold text-indigo-600 hover:underline">
            ← My bookings
          </Link>
        </div>
      </div>
    );

  const running = isRunning(booking);
  const spotTitle = spot?.title || (typeof booking.parkingId === "object" ? booking.parkingId?.title : "") || "Parking spot";
  const spotImg = photoUrl(spot?.photos?.[0]);
  const durationMs = new Date(booking.endTime || now).getTime() - new Date(booking.startTime).getTime();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/my-bookings" className="text-sm font-medium text-indigo-600 hover:underline">
        ← My bookings
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-emerald-600 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-200">ParkEase booking</p>
              <h1 className="mt-1 text-2xl font-extrabold">{spotTitle}</h1>
              <p className="mt-1 text-sm text-indigo-100">{booking.vehicleNumber} · {booking.name}</p>
            </div>
            <StatusBadge status={paid ? "paid" : booking.status} />
          </div>
        </div>

        <div className="p-6">
          {running && (
            <>
              {/* LIVE TIMER */}
              <div className="rounded-2xl bg-slate-900 p-6 text-center text-white">
                <p className="text-xs uppercase tracking-widest text-slate-400">Parked for</p>
                <p className="mt-1 font-mono text-5xl font-extrabold tabular-nums">
                  {fmtElapsed(now - new Date(booking.startTime).getTime())}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  since {fmtDateTime(booking.startTime)}
                </p>
              </div>

              {/* Estimated bill */}
              <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Estimated bill so far</p>
                  <p className="text-2xl font-extrabold text-slate-900">{fmtMoney(est?.total)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Billed {est?.unit} · {fmtMoney(spot?.priceHour)}/hour · {fmtMoney(spot?.priceDay)}/day
                  {est && est.hours >= 24 && " (day rate applied)"}
                </p>
              </div>

              {actionError && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button onClick={endParking} disabled={ending} className={`${btnPrimary} flex-1 py-3`}>
                  {ending ? "Ending…" : "🛑 End Parking"}
                </button>
                <button onClick={cancelBooking} disabled={cancelling} className={`${btnSecondary} flex-1`}>
                  {cancelling ? "Cancelling…" : "Cancel booking"}
                </button>
              </div>
            </>
          )}

          {!running && (
            <BillReceipt
              booking={booking}
              bill={bill}
              spot={spot}
              paid={paid || String(booking.status).toLowerCase() === "paid"}
              onPay={() => setPayOpen(true)}
              durationMs={durationMs}
            />
          )}

          {actionError && !running && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
          )}

          {/* Meta */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Check-in</p>
              <p className="font-semibold text-slate-900">{fmtDateTime(booking.startTime)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Check-out</p>
              <p className="font-semibold text-slate-900">
                {booking.endTime ? fmtDateTime(booking.endTime) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Mobile</p>
              <p className="font-semibold text-slate-900">{booking.mobile}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Booking ID</p>
              <p className="truncate font-mono text-xs font-semibold text-slate-900">{booking._id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mock payment modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pay now">
        <div className="rounded-2xl bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-500">Amount due</p>
          <p className="text-4xl font-extrabold text-slate-900">
            {fmtMoney(bill?.totalAmount ?? booking.totalAmount)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            This is a mock payment — no real money moves. It records the
            transaction as paid via POST /payment/mark-paid.
          </p>
        </div>
        <button onClick={payNow} disabled={paying} className={`${btnPrimary} mt-4 w-full py-3`}>
          {paying ? "Processing…" : `Pay ${fmtMoney(bill?.totalAmount ?? booking.totalAmount)}`}
        </button>
      </Modal>

      {paid && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-lg font-bold text-emerald-800">✓ Payment recorded</p>
          <p className="text-sm text-emerald-700">Thank you for parking with ParkEase!</p>
        </div>
      )}
    </div>
  );
}

function BillReceipt({ booking, bill, spot, paid, onPay, durationMs }) {
  const total = bill?.totalAmount ?? booking.totalAmount;
  const hours = bill?.hours ?? Math.max(1, Math.ceil(durationMs / 3600000));
  const days = bill?.days ?? 0;
  return (
    <div className="rounded-2xl border border-slate-200">
      <div className="border-b border-dashed border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Final bill</p>
      </div>
      <div className="space-y-2 px-5 py-4 text-sm">
        <Row k="Duration" v={days > 0 ? `${days} day${days > 1 ? "s" : ""} (${hours} hrs)` : `${hours} hour${hours > 1 ? "s" : ""}`} />
        <Row k={`Rate`} v={`${fmtMoney(bill?.priceHour ?? spot?.priceHour)}/hr · ${fmtMoney(bill?.priceDay ?? spot?.priceDay)}/day`} />
        <div className="my-2 h-px bg-slate-100" />
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-900">Total</p>
          <p className="text-2xl font-extrabold text-indigo-700">{fmtMoney(total)}</p>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 py-4">
        {paid ? (
          <p className="text-center text-sm font-bold text-emerald-600">✓ Paid</p>
        ) : (
          <button onClick={onPay} className={`${btnPrimary} w-full py-3`}>
            Pay Now · {fmtMoney(total)}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{k}</span>
      <span className="font-semibold text-slate-900">{v}</span>
    </div>
  );
}
