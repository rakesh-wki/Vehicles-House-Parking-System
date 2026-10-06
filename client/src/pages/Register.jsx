import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../lib/api";
import { Field, btnPrimary, inputCls } from "../components/ui";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    role: "customer",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        mobile: form.mobile.trim(),
        role: form.role,
      });
      navigate(user?.role === "houseOwner" ? "/owner" : "/", { replace: true });
    } catch (err) {
      setError(errMsg(err, "Registration failed. Try a different email."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Book parking as a customer, or list your spot as a house owner.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={set("name")}
              className={inputCls}
              placeholder="Aarav Sharma"
              autoComplete="name"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                className={inputCls}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Mobile">
              <input
                required
                value={form.mobile}
                onChange={set("mobile")}
                className={inputCls}
                placeholder="98765 43210"
                autoComplete="tel"
              />
            </Field>
          </div>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set("password")}
              className={inputCls}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
          </Field>
          <Field label="I want to">
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "customer", t: "🚗 Park my vehicle", d: "Find & book spots" },
                { v: "houseOwner", t: "🏠 List my parking", d: "Earn from your space" },
              ].map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r.v }))}
                  className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                    form.role === r.v
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="block text-sm font-bold text-slate-900">{r.t}</span>
                  <span className="block text-xs text-slate-500">{r.d}</span>
                </button>
              ))}
            </div>
          </Field>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
