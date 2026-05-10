import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Btn } from "../components/ui.jsx";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    await api.post("/api/auth/forgot-password", { email });
    setMsg("If that email exists on RefurbKE, a reset link is on the way.");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-border rounded bg-white shadow-card p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-ink">Reset your password</h1>
        <p className="text-sm text-muted">We will email a single-use link that expires in one hour.</p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-muted">Email</label>
            <input
              type="email"
              required
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Btn className="w-full" type="submit">
            Send reset link
          </Btn>
        </form>
        {msg && <p className="text-sm text-body">{msg}</p>}
        <Link to="/login" className="text-sm text-primary inline-block">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
