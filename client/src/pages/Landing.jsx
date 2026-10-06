import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const STEPS = [
  {
    n: "1",
    title: "Search nearby spots",
    text: "Allow location access or enter an area to see verified private parking spots around you on the map.",
    icon: "📍",
  },
  {
    n: "2",
    title: "Book instantly",
    text: "Pick a spot, share your vehicle details and get a 4-digit check-in OTP — no advance payment needed.",
    icon: "⚡",
  },
  {
    n: "3",
    title: "Park & pay on exit",
    text: "Watch the live timer while parked. End parking when you leave and pay the exact hourly or daily amount.",
    icon: "🧾",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const goToSearch = (params) => {
    const qs = new URLSearchParams(params).toString();
    navigate(`/search${qs ? `?${qs}` : ""}`);
  };

  const useMyLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        goToSearch({
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
        });
      },
      () => {
        setLocating(false);
        setError("Could not get your location. Try entering coordinates or a city instead.");
      },
      { timeout: 10000 }
    );
  };

  const searchCity = async (e) => {
    e.preventDefault();
    setError("");
    const q = city.trim();
    if (!q) return;
    try {
      // Public geocoding via OpenStreetMap Nominatim (no API key needed).
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        goToSearch({ lat: Number(data[0].lat).toFixed(5), lng: Number(data[0].lon).toFixed(5) });
      } else {
        setError(`Could not find “${q}”. Try a different spelling.`);
      }
    } catch {
      setError("City lookup failed. Check your connection and try again.");
    }
  };

  const searchCoords = (e) => {
    e.preventDefault();
    setError("");
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (Number.isFinite(la) && Number.isFinite(ln)) {
      goToSearch({ lat: la, lng: ln });
    } else {
      setError("Enter valid latitude and longitude numbers.");
    }
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-emerald-600">
        <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_30%_20%,white,transparent_40%),radial-gradient(circle_at_70%_80%,white,transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              🅿️ Rent private house parking by the hour
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Parking spots near you,{" "}
              <span className="text-emerald-300">right when you need them.</span>
            </h1>
            <p className="mt-4 text-lg text-indigo-100">
              ParkEase connects drivers with verified private parking spots.
              See live availability on the map, book in seconds, pay on exit.
            </p>

            {/* Find parking near me */}
            <div className="mt-8 rounded-2xl bg-white p-5 shadow-2xl">
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-base font-bold text-white shadow transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {locating ? "Locating…" : "📍 Find parking near me"}
              </button>

              <div className="my-4 flex items-center gap-3 text-xs font-semibold text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> OR{" "}
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={searchCity} className="flex gap-2">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city or area, e.g. Jaipur"
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Search
                </button>
              </form>

              <form onSubmit={searchCoords} className="mt-2 flex gap-2">
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  inputMode="decimal"
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  inputMode="decimal"
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Go
                </button>
              </form>

              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
          How ParkEase works
        </h2>
        <p className="mt-2 text-center text-slate-500">
          Three simple steps between you and a safe parking spot.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                {s.icon}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-indigo-600">
                Step {s.n}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OWNER CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 sm:px-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Got an empty driveway or plot?
              </h2>
              <p className="mt-2 max-w-xl text-slate-300">
                List your private parking spot on ParkEase and earn every time
                someone parks. You control availability, pricing and timing.
              </p>
            </div>
            <Link
              to="/register"
              className="shrink-0 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-emerald-600"
            >
              List your parking →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
