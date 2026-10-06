import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errMsg, freeSlotsOf, isPending, latLngOf, photoUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import SpotMap from "../components/SpotMap";
import {
  Badge,
  EmptyState,
  Field,
  Modal,
  Spinner,
  StatusBadge,
  btnPrimary,
  btnSecondary,
  fmtMoney,
  inputCls,
} from "../components/ui";

const GALLERY_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#10b981"/></linearGradient></defs><rect width="1200" height="700" fill="url(#g)"/><text x="600" y="350" font-family="sans-serif" font-size="64" fill="white" text-anchor="middle" opacity="0.9">🅿️ ParkEase</text></svg>`
  );

function Stars({ value, onPick, size = "text-2xl" }) {
  return (
    <div className={`flex gap-1 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPick && onPick(n)}
          className={onPick ? "transition hover:scale-110" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <span className={n <= value ? "text-amber-400" : "text-slate-300"}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function SpotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthed } = useAuth();

  const [spot, setSpot] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoIdx, setPhotoIdx] = useState(0);

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Booking modal
  const [bookOpen, setBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
    vehicleNumber: "",
  });
  const [bookBusy, setBookBusy] = useState(false);
  const [bookError, setBookError] = useState("");
  const [bookResult, setBookResult] = useState(null); // { booking, checkinOtp }

  const fetchSpot = useCallback(async () => {
    try {
      const res = await api.get(`/parking/${id}`);
      setSpot(res.data?.spot || res.data);
    } catch (err) {
      setError(errMsg(err, "Could not load this parking spot."));
    }
  }, [id]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await api.get(`/parking/${id}/availability`);
      setAvailability(res.data);
    } catch {
      // Availability is best-effort; the spot page still works without it.
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/spot/${id}`);
      const data = res.data;
      setReviews(Array.isArray(data) ? data : data?.reviews || []);
    } catch {
      setReviews([]);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSpot(), fetchAvailability(), fetchReviews()]).finally(() =>
      setLoading(false)
    );
    const t = setInterval(fetchAvailability, 15000);
    return () => clearInterval(t);
  }, [fetchSpot, fetchAvailability, fetchReviews]);

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewBusy(true);
    try {
      await api.post("/reviews", { spotId: id, rating, comment: comment.trim() });
      setComment("");
      setRating(5);
      await fetchReviews();
    } catch (err) {
      setReviewError(errMsg(err, "Could not submit your review."));
    } finally {
      setReviewBusy(false);
    }
  };

  const openBooking = () => {
    setBookForm({
      name: user?.name || "",
      mobile: user?.mobile || "",
      vehicleNumber: "",
    });
    setBookError("");
    setBookResult(null);
    setBookOpen(true);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setBookError("");
    setBookBusy(true);
    try {
      const res = await api.post("/booking/start", {
        parkingId: id,
        name: bookForm.name.trim(),
        mobile: bookForm.mobile.trim(),
        vehicleNumber: bookForm.vehicleNumber.trim(),
      });
      // Contract: { booking, checkinOtp }
      setBookResult(res.data);
      await fetchAvailability();
    } catch (err) {
      setBookError(errMsg(err, "Booking failed. Try again."));
    } finally {
      setBookBusy(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><Spinner label="Loading spot…" /></div>;
  if (error || !spot)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Spot not found" hint={error || "This parking spot may have been removed."} />
        <div className="mt-4 text-center">
          <Link to="/search" className="font-semibold text-indigo-600 hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    );

  const photos = (spot.photos || []).map(photoUrl).filter(Boolean);
  const mainPhoto = photos[photoIdx] || GALLERY_PLACEHOLDER;
  const free = availability?.freeSlots ?? freeSlotsOf(spot);
  const pending = isPending(spot) || String(spot.status || "").toLowerCase() === "pending";
  const mapPos = latLngOf(spot);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/search" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          {/* Gallery */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
            <img src={mainPhoto} alt={spot.title} className="h-72 w-full object-cover sm:h-96" />
          </div>
          {photos.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIdx(i)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === photoIdx ? "border-indigo-600" : "border-transparent"
                  }`}
                >
                  <img src={p} alt={`photo ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title & meta */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              {pending ? <Badge tone="amber">Pending approval</Badge> : <StatusBadge status={spot.isAvailable === false ? "unavailable" : "available"} />}
              {typeof spot.avgRating === "number" && spot.avgRating > 0 && (
                <Badge tone="indigo">
                  ★ {spot.avgRating.toFixed(1)} ({spot.ratingCount || 0} reviews)
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {spot.title}
            </h1>
            <p className="mt-1 text-slate-500">📍 {spot.address}</p>
          </div>

          {/* Live availability */}
          <div
            className={`mt-5 flex items-center justify-between rounded-2xl border p-4 ${
              free > 0
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                    free > 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    free > 0 ? "bg-emerald-600" : "bg-red-600"
                  }`}
                />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {free > 0 ? `${free} of ${availability?.capacity ?? spot.capacity ?? "?"} slots free` : "Currently full"}
                </p>
                <p className="text-xs text-slate-500">Live availability · refreshes every 15s</p>
              </div>
            </div>
            <button
              onClick={fetchAvailability}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Pricing */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Per hour</p>
              <p className="text-xl font-extrabold text-indigo-700">{fmtMoney(spot.priceHour)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Per day</p>
              <p className="text-xl font-extrabold text-indigo-700">{fmtMoney(spot.priceDay)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Capacity</p>
              <p className="text-xl font-extrabold text-slate-900">{spot.capacity ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Hours</p>
              <p className="text-sm font-bold text-slate-900">
                {spot.openTime || "—"} – {spot.closeTime || "—"}
              </p>
            </div>
          </div>

          {/* Amenities */}
          {(spot.amenities || []).length > 0 && (
            <div className="mt-5">
              <h2 className="text-lg font-bold text-slate-900">Amenities</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {spot.amenities.map((a) => (
                  <Badge key={a} tone="blue">
                    ✓ {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle types */}
          {(spot.vehicleTypes || []).length > 0 && (
            <div className="mt-5">
              <h2 className="text-lg font-bold text-slate-900">Vehicle types</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {spot.vehicleTypes.map((v) => (
                  <Badge key={v} tone="slate">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {spot.description && (
            <div className="mt-5">
              <h2 className="text-lg font-bold text-slate-900">About this spot</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{spot.description}</p>
            </div>
          )}

          {mapPos && (
            <div className="mt-6">
              <h2 className="mb-2 text-lg font-bold text-slate-900">Location</h2>
              <SpotMap spots={[spot]} center={mapPos} height={280} fitToSpots={false} />
            </div>
          )}

          {/* Reviews */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">
              Reviews ({reviews.length})
            </h2>
            {isAuthed ? (
              <form onSubmit={submitReview} className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700">Write a review</p>
                <div className="mt-2">
                  <Stars value={rating} onPick={setRating} />
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="How was your parking experience?"
                  className={`${inputCls} mt-2`}
                />
                {reviewError && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {reviewError}
                  </p>
                )}
                <button type="submit" disabled={reviewBusy} className={`${btnPrimary} mt-3`}>
                  {reviewBusy ? "Posting…" : "Post review"}
                </button>
              </form>
            ) : (
              <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                  Log in
                </Link>{" "}
                to write a review.
              </p>
            )}
            <div className="mt-4 space-y-3">
              {reviews.length === 0 && (
                <p className="text-sm text-slate-400">No reviews yet. Be the first!</p>
              )}
              {reviews.map((r) => (
                <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      {r.userId?.name || r.name || "Anonymous"}
                    </p>
                    <Stars value={r.rating} size="text-base" />
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky booking card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg lg:sticky lg:top-20">
            <p className="text-3xl font-extrabold text-slate-900">
              {fmtMoney(spot.priceHour)}
              <span className="text-sm font-medium text-slate-500"> /hour</span>
            </p>
            <p className="mt-0.5 text-sm text-slate-500">{fmtMoney(spot.priceDay)} /day</p>
            <div className="my-4 h-px bg-slate-100" />
            <p className="text-sm text-slate-600">
              {free > 0 ? (
                <>
                  <span className="font-bold text-emerald-600">{free} slots free</span> — book now, pay on exit.
                </>
              ) : (
                <span className="font-bold text-red-600">Currently full.</span>
              )}
            </p>
            <button
              onClick={openBooking}
              disabled={pending || free <= 0}
              className={`${btnPrimary} mt-4 w-full py-3 text-base`}
            >
              Book Now
            </button>
            <p className="mt-3 text-xs text-slate-400">
              No advance payment. You get a 4-digit check-in OTP after booking.
            </p>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Book this spot">
        {bookResult ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ✓
            </div>
            <h3 className="mt-3 text-xl font-extrabold text-slate-900">Booking confirmed!</h3>
            <p className="mt-1 text-sm text-slate-500">
              Show this OTP at check-in:
            </p>
            <p className="mx-auto mt-4 w-fit rounded-2xl bg-slate-900 px-8 py-4 text-4xl font-extrabold tracking-[0.4em] text-white">
              {bookResult.checkinOtp}
            </p>
            <button
              onClick={() => navigate(`/booking/${bookResult.booking?._id}`, { state: { booking: bookResult.booking, spot } })}
              className={`${btnPrimary} mt-6 w-full`}
            >
              Go to Active Booking →
            </button>
            <button onClick={() => setBookOpen(false)} className={`${btnSecondary} mt-2 w-full`}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submitBooking} className="space-y-4">
            <Field label="Your name">
              <input
                required
                value={bookForm.name}
                onChange={(e) => setBookForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
                placeholder="Full name"
              />
            </Field>
            <Field label="Mobile number">
              <input
                required
                value={bookForm.mobile}
                onChange={(e) => setBookForm((f) => ({ ...f, mobile: e.target.value }))}
                className={inputCls}
                placeholder="98765 43210"
              />
            </Field>
            <Field label="Vehicle number">
              <input
                required
                value={bookForm.vehicleNumber}
                onChange={(e) => setBookForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))}
                className={inputCls}
                placeholder="RJ14 AB 1234"
              />
            </Field>
            {bookError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{bookError}</p>
            )}
            <button type="submit" disabled={bookBusy} className={`${btnPrimary} w-full`}>
              {bookBusy ? "Booking…" : "Confirm booking"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
