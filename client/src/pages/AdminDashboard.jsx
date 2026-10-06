import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../lib/api";
import {
  Badge,
  EmptyState,
  PageHeader,
  Spinner,
  StatCard,
  StatusBadge,
  fmtDateTime,
  fmtMoney,
} from "../components/ui";

const TABS = [
  { id: "approvals", label: "Pending Approvals" },
  { id: "users", label: "Users" },
  { id: "spots", label: "All Spots" },
  { id: "bookings", label: "All Bookings" },
  { id: "revenue", label: "Transactions & Revenue" },
];

/** Read the first defined value from a list of candidate keys. */
function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function asArray(d) {
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    for (const k of ["items", "data", "results", "list"]) {
      if (Array.isArray(d[k])) return d[k];
    }
  }
  return [];
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function AdminDashboard() {
  const [tab, setTab] = useState("approvals");
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [revenueReport, setRevenueReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, u, s, b, t, r] = await Promise.all([
        api.get("/admin/dashboard").then((res) => res.data).catch(() => null),
        api.get("/admin/users").then((res) => res.data).catch(() => []),
        api.get("/admin/parking").then((res) => res.data).catch(() => []),
        api.get("/admin/bookings").then((res) => res.data).catch(() => []),
        api.get("/admin/transactions").then((res) => res.data).catch(() => []),
        api.get("/admin/reports/revenue").then((res) => res.data).catch(() => []),
      ]);
      setDashboard(dash);
      setUsers(asArray(u));
      setSpots(asArray(s));
      setBookings(asArray(b));
      setTransactions(asArray(t));
      setRevenueReport(asArray(r));
    } catch (err) {
      setError(errMsg(err, "Could not load admin data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const d = dashboard || {};
    const totalRevenue =
      pick(d, ["totalRevenue", "revenue", "earnings"]) ??
      transactions.reduce((s, t) => s + (Number(pick(t, ["amount", "total", "totalAmount"])) || 0), 0);
    return {
      users: pick(d, ["totalUsers", "users", "userCount"]) ?? users.length,
      spots: pick(d, ["totalSpots", "spots", "parkingCount", "spotCount"]) ?? spots.length,
      bookings: pick(d, ["totalBookings", "bookings", "bookingCount"]) ?? bookings.length,
      revenue: totalRevenue,
      pending: pick(d, ["pendingSpots", "pending", "pendingCount"]) ?? spots.filter((s) => String(s.status).toLowerCase() === "pending").length,
    };
  }, [dashboard, users, spots, bookings, transactions]);

  // Normalize revenue report → last 7 days bars.
  const bars = useMemo(() => {
    const days = last7Days();
    const byDay = {};
    const push = (dateVal, amount) => {
      const d = new Date(dateVal);
      if (Number.isNaN(d.getTime())) return;
      const k = dayKey(d);
      byDay[k] = (byDay[k] || 0) + (Number(amount) || 0);
    };
    if (revenueReport.length > 0) {
      revenueReport.forEach((r) => {
        push(
          pick(r, ["date", "day", "_id", "createdAt"]),
          pick(r, ["revenue", "total", "amount", "totalAmount"])
        );
      });
    } else {
      transactions.forEach((t) => {
        push(
          pick(t, ["createdAt", "date", "paidAt"]),
          pick(t, ["amount", "total", "totalAmount"])
        );
      });
    }
    const vals = days.map((d) => ({ date: d, total: byDay[dayKey(d)] || 0 }));
    const max = Math.max(1, ...vals.map((v) => v.total));
    return vals.map((v) => ({ ...v, pct: Math.round((v.total / max) * 100) }));
  }, [revenueReport, transactions]);

  const pendingSpots = spots.filter((s) => String(s.status).toLowerCase() === "pending");

  const act = async (fn, label) => {
    setBusy(label);
    try {
      await fn();
      await load();
    } catch (err) {
      alert(errMsg(err, "Action failed."));
    } finally {
      setBusy("");
    }
  };

  const approveSpot = (s) => act(() => api.put(`/admin/parking/${s._id}/approve`), `approve-${s._id}`);
  const rejectSpot = (s) => {
    if (!window.confirm(`Reject spot "${s.title}"?`)) return;
    return act(() => api.put(`/admin/parking/${s._id}/reject`), `reject-${s._id}`);
  };
  const toggleUser = (u) =>
    act(() => api.put(`/admin/users/${u._id}`, { isActive: !(u.isActive ?? true) }), `user-${u._id}`);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><Spinner label="Loading admin data…" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader title="Admin dashboard" sub="Platform overview, approvals and management." />
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Users" value={stats.users} icon="👥" />
        <StatCard label="Parking spots" value={stats.spots} icon="🅿️" />
        <StatCard label="Bookings" value={stats.bookings} icon="🧾" />
        <StatCard label="Revenue" value={fmtMoney(stats.revenue)} icon="💰" />
        <StatCard label="Pending approvals" value={stats.pending} icon="⏳" sub="Spots awaiting review" />
      </div>

      {/* Revenue bar chart (divs) */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Revenue — last 7 days</h2>
        <div className="mt-4 flex h-44 items-end gap-2 sm:gap-3">
          {bars.map((b) => (
            <div key={dayKey(b.date)} className="flex flex-1 flex-col items-center gap-1">
              <p className="text-[10px] font-semibold text-slate-500">{b.total > 0 ? fmtMoney(b.total) : ""}</p>
              <div className="flex w-full flex-1 items-end rounded-t-lg bg-slate-100">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-emerald-500 transition-all"
                  style={{ height: `${Math.max(b.pct, b.total > 0 ? 4 : 0)}%` }}
                  title={`${b.date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}: ${fmtMoney(b.total)}`}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {b.date.toLocaleDateString("en-IN", { weekday: "short" })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 mt-8 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-indigo-600 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
            {t.id === "approvals" && pendingSpots.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                {pendingSpots.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "approvals" && (
        <div className="space-y-3">
          {pendingSpots.length === 0 && (
            <EmptyState title="Nothing pending" hint="All parking spots have been reviewed." />
          )}
          {pendingSpots.map((s) => (
            <div key={s._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to={`/spot/${s._id}`} className="font-bold text-indigo-700 hover:underline">
                  {s.title}
                </Link>
                <p className="text-sm text-slate-500">{s.address}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Owner: {typeof s.ownerId === "object" ? s.ownerId?.name || s.ownerId?.email : s.ownerId || "—"} ·
                  Capacity {s.capacity} · {fmtMoney(s.priceHour)}/hr
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => approveSpot(s)}
                  disabled={busy === `approve-${s._id}`}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy === `approve-${s._id}` ? "…" : "Approve"}
                </button>
                <button
                  onClick={() => rejectSpot(s)}
                  disabled={busy === `reject-${s._id}`}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busy === `reject-${s._id}` ? "…" : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.mobile || "—"}</td>
                  <td className="px-4 py-3"><Badge tone="indigo">{u.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive === false ? "red" : "green"}>
                      {u.isActive === false ? "Inactive" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleUser(u)}
                      disabled={busy === `user-${u._id}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${
                        u.isActive === false ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-500 hover:bg-slate-600"
                      }`}
                    >
                      {busy === `user-${u._id}` ? "…" : u.isActive === false ? "Activate" : "Deactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "spots" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Spot</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {spots.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/spot/${s._id}`} className="font-bold text-indigo-700 hover:underline">
                      {s.title}
                    </Link>
                    <p className="max-w-[220px] truncate text-xs text-slate-500">{s.address}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {typeof s.ownerId === "object" ? s.ownerId?.name || s.ownerId?.email : s.ownerId || "—"}
                  </td>
                  <td className="px-4 py-3">{s.capacity ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtMoney(s.priceHour)}/hr</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "bookings" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Spot</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
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
                  <td className="px-4 py-3">{b.name}<p className="text-xs text-slate-500">{b.mobile}</p></td>
                  <td className="px-4 py-3">{b.vehicleNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(b.startTime)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(b.endTime)}</td>
                  <td className="px-4 py-3 font-bold">{b.totalAmount != null ? fmtMoney(b.totalAmount) : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "revenue" && (
        <div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total revenue" value={fmtMoney(stats.revenue)} icon="💰" />
            <StatCard label="Transactions" value={transactions.length} icon="💳" />
            <StatCard
              label="Avg. transaction"
              value={transactions.length ? fmtMoney(Number(stats.revenue) / transactions.length) : "—"}
              icon="📊"
            />
          </div>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
                {transactions.map((t) => (
                  <tr key={t._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {String(t._id).slice(-8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {String(pick(t, ["bookingId", "booking"]) || "").slice(-8) || "—"}
                    </td>
                    <td className="px-4 py-3 font-bold">{fmtMoney(pick(t, ["amount", "total", "totalAmount"]))}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {fmtDateTime(pick(t, ["createdAt", "paidAt", "date"]))}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={pick(t, ["status"]) || "paid"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
