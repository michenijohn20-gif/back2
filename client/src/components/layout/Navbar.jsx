import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { BtnLink } from "../ui.jsx";

/** Shown when API is down or DB not seeded — slugs match `prisma/seed.js` */
const FALLBACK_CATEGORIES = [
  { id: "fb-smartphones", name: "Smartphones", slug: "smartphones" },
  { id: "fb-laptops", name: "Laptops", slug: "laptops" },
  { id: "fb-tablets", name: "Tablets", slug: "tablets" },
  { id: "fb-audio", name: "Audio", slug: "audio" },
  { id: "fb-gaming", name: "Gaming", slug: "gaming" },
  { id: "fb-cameras", name: "Cameras", slug: "cameras" },
  { id: "fb-accessories", name: "Accessories", slug: "accessories" },
];

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
  const location = useLocation();
  const activeCategorySlug =
    location.pathname === "/products"
      ? new URLSearchParams(location.search).get("categories")?.split(",")[0] ?? null
      : null;
  const count = useCartStore((s) => s.count());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    api
      .get("/api/categories")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        setCategories(list.length ? list : FALLBACK_CATEGORIES);
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES));
  }, []);

  const navCategories = categories.length ? categories : FALLBACK_CATEGORIES;

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

          <form onSubmit={onSearch} className="flex-1 min-w-0 md:flex-initial md:w-64 md:max-w-xs">
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

      <div className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav
            className="flex gap-1 sm:gap-3 overflow-x-auto py-2.5 text-sm text-body [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Product categories"
          >
            {navCategories.map((c) => (
              <NavLink
                key={c.id}
                to={`/products?categories=${c.slug}`}
                className={() =>
                  `shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 hover:bg-surface hover:text-primary ${
                    activeCategorySlug === c.slug ? "bg-[#EFF6FF] text-primary font-semibold" : ""
                  }`
                }
              >
                {c.name}
              </NavLink>
            ))}
            <Link
              to="/products"
              className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 hover:bg-surface hover:text-primary ${
                location.pathname === "/products" && !activeCategorySlug
                  ? "bg-[#EFF6FF] text-primary font-semibold"
                  : "text-muted"
              }`}
            >
              All products
            </Link>
          </nav>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 pb-4">
          <div className="flex flex-col gap-2 py-2">
            {navCategories.map((c) => (
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
