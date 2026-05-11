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
        {/* Google Sign-in Button */}
        <button
          type="button"
          onClick={googleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </button>
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
