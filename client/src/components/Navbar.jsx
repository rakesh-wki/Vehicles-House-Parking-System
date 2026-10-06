import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navCls({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

export default function Navbar() {
  const { user, isAuthed, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const isOwner = user?.role === "houseOwner" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-[900] border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow">
            P
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Park<span className="text-indigo-600">Ease</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/search" className={navCls}>
            Find Parking
          </NavLink>
          {isAuthed && (
            <NavLink to="/my-bookings" className={navCls}>
              My Bookings
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/owner" className={navCls}>
              Owner Dashboard
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navCls}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!isAuthed ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="max-w-[160px] truncate text-sm text-slate-600">
                Hi, <span className="font-semibold text-slate-900">{user?.name}</span>
              </span>
              <button
                onClick={onLogout}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          <span className="text-xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/search" className={navCls} onClick={() => setOpen(false)}>
              Find Parking
            </NavLink>
            {isAuthed && (
              <NavLink to="/my-bookings" className={navCls} onClick={() => setOpen(false)}>
                My Bookings
              </NavLink>
            )}
            {isOwner && (
              <NavLink to="/owner" className={navCls} onClick={() => setOpen(false)}>
                Owner Dashboard
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navCls} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            )}
            {!isAuthed ? (
              <>
                <NavLink to="/login" className={navCls} onClick={() => setOpen(false)}>
                  Log in
                </NavLink>
                <NavLink to="/register" className={navCls} onClick={() => setOpen(false)}>
                  Sign up
                </NavLink>
              </>
            ) : (
              <button
                onClick={onLogout}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Log out ({user?.name})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
