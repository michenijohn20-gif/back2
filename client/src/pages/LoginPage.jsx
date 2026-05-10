import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../lib/api";
import { Btn } from "../components/ui.jsx";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setSession(data);
      setAuthToken(data.accessToken);
      navigate("/account");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const googleLogin = () => {
    if (!googleClientId) {
      window.alert(
        "Add VITE_GOOGLE_CLIENT_ID to the client .env and configure GOOGLE_CLIENT_ID on the server to enable Google sign-in.",
      );
      return;
    }
    if (!window.google?.accounts?.id) {
      window.alert("Google script still loading — try again in a second.");
      return;
    }
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (resp) => {
        try {
          const { data } = await api.post("/api/auth/google", { credential: resp.credential });
          setSession(data);
          setAuthToken(data.accessToken);
          navigate("/account");
        } catch (err) {
          setError(err.response?.data?.error || "Google sign-in failed");
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-border rounded bg-white shadow-card p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Sign in to track orders and wishlists.</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
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
          <div>
            <label className="text-sm text-muted">Password</label>
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
            Sign in
          </Btn>
        </form>
        <Btn variant="secondary" className="w-full" type="button" onClick={googleLogin}>
          Continue with Google
        </Btn>
        <p className="text-sm text-center text-muted">
          <Link className="text-primary" to="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <p className="text-sm text-center text-muted">
          New to RefurbKE?{" "}
          <Link className="text-primary font-medium" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
