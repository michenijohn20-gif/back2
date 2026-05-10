import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { Btn } from "../components/ui.jsx";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/auth/reset-password", { token, password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to reset");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-border rounded bg-white shadow-card p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-ink">Choose a new password</h1>
        {!token ? (
          <p className="text-sm text-red-600">Missing reset token. Request a fresh link.</p>
        ) : (
          <form className="space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="text-sm text-muted">New password</label>
              <input
                type="password"
                required
                className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Btn className="w-full" type="submit">
              Update password
            </Btn>
          </form>
        )}
        <Link to="/login" className="text-sm text-primary inline-block">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
