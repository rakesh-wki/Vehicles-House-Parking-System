import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Any logged-in user. */
export function RequireAuth() {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Outlet />;
}

/** Role-based guard: /owner needs houseOwner|admin, /admin needs admin. */
export function RequireRole({ roles }) {
  const { user, isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
