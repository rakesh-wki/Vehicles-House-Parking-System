import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, RequireRole } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import SearchPage from "./pages/SearchPage";
import SpotDetail from "./pages/SpotDetail";
import BookingDetail from "./pages/BookingDetail";
import MyBookings from "./pages/MyBookings";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl">🅿️</p>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">This spot doesn't exist — let's get you back on the road.</p>
      <a href="/" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
        Go home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/spot/:id" element={<SpotDetail />} />
              <Route path="/booking/:id" element={<BookingDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Logged-in customers */}
              <Route element={<RequireAuth />}>
                <Route path="/my-bookings" element={<MyBookings />} />
              </Route>

              {/* Owners + admins */}
              <Route element={<RequireRole roles={["houseOwner", "admin"]} />}>
                <Route path="/owner" element={<OwnerDashboard />} />
              </Route>

              {/* Admins only */}
              <Route element={<RequireRole roles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
