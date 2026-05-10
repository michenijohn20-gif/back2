import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../lib/api";
import { Btn } from "../components/ui.jsx";
import { useAuthStore } from "../store/authStore";
import { isValidKenyaPhone } from "../utils/phone";

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password needs at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.phone && !isValidKenyaPhone(form.phone)) {
      setError("Use a Kenyan phone such as 07XXXXXXXX or +2547XXXXXXXX.");
      return;
    }
    try {
      const { data } = await api.post("/api/auth/register", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setSession(data);
      setAuthToken(data.accessToken);
      navigate("/account");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-border rounded bg-white shadow-card p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Create your RefurbKE account</h1>
          <p className="text-sm text-muted mt-1">Save addresses, favourite devices, and order history.</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-muted">Full name</label>
            <input
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted">Email</label>
            <input
              type="email"
              required
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted">Phone (optional)</label>
            <input
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted">Password</label>
            <input
              type="password"
              required
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted">Confirm password</label>
            <input
              type="password"
              required
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Btn className="w-full" type="submit">
            Register
          </Btn>
        </form>
        <p className="text-sm text-center text-muted">
          Already have an account?{" "}
          <Link className="text-primary font-medium" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
