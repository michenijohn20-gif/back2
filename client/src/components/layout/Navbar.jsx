import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { BtnLink } from "../ui.jsx";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.2 10.2a1 1 0 001 .8h8.7a1 1 0 001-.8L21 7H7" strokeLinecap="round" />
      <circle cx="10" cy="19" r="1.25" />
      <circle cx="17" cy="19" r="1.25" />
    </svg>
  );
}

export function Navbar() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const count = useCartStore((s) => s.count());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    api
      .get("/api/categories")
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const s = q.trim();
    if (!s) return;
    navigate(`/search?q=${encodeURIComponent(s)}`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 rounded border border-border"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
          <Link to="/" className="font-bold text-ink text-lg shrink-0">
            Refurb<span className="text-primary">KE</span>
          </Link>

          <nav className="hidden md:flex flex-1 justify-center gap-4 text-sm text-body">
            {categories.slice(0, 7).map((c) => (
              <NavLink
                key={c.id}
                to={`/products?categories=${c.slug}`}
                className={({ isActive }) =>
                  `hover:text-primary whitespace-nowrap ${isActive ? "text-primary font-semibold" : ""}`
                }
              >
                {c.name}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={onSearch} className="flex-1 md:flex-initial md:w-64">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search phones, laptops…"
              className="w-full border border-border rounded-[6px] px-3 py-2 text-sm bg-white"
            />
          </form>

          <Link
            to="/cart"
            className="relative p-2 rounded border border-border text-ink hover:border-primary"
            aria-label="Cart"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-primary text-white rounded-full px-1.5 min-w-[1.25rem] text-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/account" className="text-sm text-body hover:text-primary">
                Account
              </Link>
              <button type="button" className="text-sm text-muted" onClick={() => logout()}>
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <BtnLink to="/login" variant="secondary" className="px-3 py-2 text-sm">
                Log in
              </BtnLink>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 pb-4">
          <div className="flex flex-col gap-2 py-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/products?categories=${c.slug}`}
                className="py-2 border-b border-border text-ink"
                onClick={() => setOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <Link to="/account" className="py-2" onClick={() => setOpen(false)}>
              Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
