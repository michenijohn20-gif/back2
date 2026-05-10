import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, setAdminApiToken } from "../../lib/adminApi.js";
import { Btn } from "../../components/ui.jsx";
import { useAdminStore } from "../../store/adminStore.js";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const setSession = useAdminStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await adminApi.post("/api/admin/auth/login", { email, password });
      setSession({ token: data.token, admin: data.admin });
      setAdminApiToken(data.token);
      navigate("/admin");
    } catch {
      setError("Invalid administrator credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <form
        className="w-full max-w-md border border-border rounded bg-white shadow-card p-8 space-y-4"
        onSubmit={submit}
      >
        <h1 className="text-2xl font-semibold text-ink">Admin sign-in</h1>
        <p className="text-sm text-muted">Separate login from customer accounts.</p>
        <div>
          <label className="text-sm text-muted">Email</label>
          <input
            className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div>
          <label className="text-sm text-muted">Password</label>
          <input
            className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Btn className="w-full" type="submit">
          Enter dashboard
        </Btn>
      </form>
    </div>
  );
}
