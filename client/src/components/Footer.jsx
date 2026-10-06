import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-lg font-extrabold text-slate-900">
            Park<span className="text-indigo-600">Ease</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Rent private house parking spots by the hour or day — secure, verified
            and close to you.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Explore</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>
              <Link to="/search" className="hover:text-indigo-600">
                Find parking
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-indigo-600">
                List your parking
              </Link>
            </li>
            <li>
              <Link to="/my-bookings" className="hover:text-indigo-600">
                My bookings
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Account</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>
              <Link to="/login" className="hover:text-indigo-600">
                Log in
              </Link>
            </li>
            <li>
              <Link to="/owner" className="hover:text-indigo-600">
                Owner dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ParkEase. All rights reserved.
      </div>
    </footer>
  );
}
