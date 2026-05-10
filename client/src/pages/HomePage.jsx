import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Btn, BtnLink } from "../components/ui.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { ProductGridSkeleton } from "../components/SkeletonGrid.jsx";

const trust = [
  { t: "Tested & Verified", d: "65+ point refurbishment checklist before dispatch." },
  { t: "M-Pesa Payments", d: "STK Push and card checkout via Pesapal at checkout." },
  { t: "Nairobi Delivery", d: "Same-county Nairobi routes with predictable flat rates." },
  { t: "12‑Month Warranty", d: "Local warranty honoured by RefurbKE on eligible devices." },
];

const TrustIcon = ({ type }) => {
  if (type === "tested") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
        <path d="M8.5 12.2l2.2 2.2 4.8-4.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "mpesa") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="2.8" width="12" height="18.4" rx="2.2" />
        <path d="M9 8.5h6M9 12h6M10.5 16h3" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "delivery") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2.5 7.5h12v8h-12z" />
        <path d="M14.5 10.5h4l2 2v3h-6z" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="18" cy="17.5" r="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
      <path d="M12 9v4" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r=".8" fill="currentColor" />
    </svg>
  );
};

export function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [fp, cg] = await Promise.all([
          api.get("/api/products", { params: { featured: "true", pageSize: 8, sort: "featured" } }),
          api.get("/api/categories"),
        ]);
        if (cancelled) return;
        let products = fp.data?.products || [];
        if (products.length === 0) {
          const fb = await api.get("/api/products", { params: { pageSize: 8, sort: "newest" } });
          if (!cancelled) products = fb.data?.products || [];
        }
        setFeatured(products);
        setCats(cg.data || []);
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[HomePage] products/categories fetch failed", e);
        if (!cancelled) {
          setFeatured([]);
          setCats([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-[clamp(1.75rem,2vw+1rem,2.2rem)] font-bold text-ink leading-tight">
              Trusted refurbished smartphones & laptops priced in Kenyan Shillings
            </h1>
            <p className="mt-4 text-body text-[15px] max-w-xl">
              RefurbKE sources tested devices comparable to certified refurb standards, optimised for Kenyan
              power, networks, and delivery realities—without overseas markups priced in euros.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BtnLink to="/products">Browse deals</BtnLink>
              <Btn variant="secondary" onClick={() => (window.location.href = "/products?categories=gaming")}>
                Shop gaming rigs
              </Btn>
            </div>
          </div>
          <div className="bg-white rounded border border-border shadow-card p-4 max-w-md mx-auto w-full">
            <p className="text-sm text-muted uppercase tracking-wide mb-3">Featured right now</p>
            {!loading && featured[0] ? (
              <ProductCard product={featured[0]} dense />
            ) : !loading ? (
              <div className="h-72 flex flex-col items-center justify-center gap-2 text-muted text-sm px-4 text-center">
                <p>No catalogue items yet, or the API is not reachable.</p>
                <Link to="/products" className="text-primary font-medium hover:underline">
                  Open all products
                </Link>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted">Loading…</div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trust.map((x, idx) => (
            <div key={x.t} className="border border-border rounded bg-white shadow-card p-4">
              <TrustIcon type={idx === 0 ? "tested" : idx === 1 ? "mpesa" : idx === 2 ? "delivery" : "warranty"} />
              <p className="mt-3 font-semibold text-ink">{x.t}</p>
              <p className="text-sm text-muted mt-1">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-ink">Shop by category</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            View everything
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {cats.map((c) => (
            <Link
              key={c.id}
              to={`/products?categories=${c.slug}`}
              className="border border-border rounded bg-white shadow-card p-4 text-center hover:border-primary transition flex flex-col items-center gap-2"
            >
              {c.iconUrl ? (
                <img
                  src={c.iconUrl}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 rounded"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded bg-surface flex items-center justify-center text-lg">◎</div>
              )}
              <span className="text-sm font-medium text-ink">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-ink">Featured products</h2>
            <Link to="/products" className="text-sm text-primary hover:underline">
              See catalogue
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton cols={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {featured.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-xl font-semibold text-ink mb-6">How RefurbKE works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-border rounded bg-white shadow-card p-5">
            <p className="text-primary font-semibold text-sm mb-2">Step 1</p>
            <h3 className="text-lg text-ink font-semibold mb-2">Browse & compare</h3>
            <p className="text-sm text-muted">
              Filter Kenyan pricing, refurbishment grade, colour, storage, then shortlist confidently.
            </p>
          </div>
          <div className="border border-border rounded bg-white shadow-card p-5">
            <p className="text-primary font-semibold text-sm mb-2">Step 2</p>
            <h3 className="text-lg text-ink font-semibold mb-2">Order & pay via M-Pesa</h3>
            <p className="text-sm text-muted">
              Choose STK Push to your Kenyan line or Pesapal checkout for Mastercard and Visa rails.
            </p>
          </div>
          <div className="border border-border rounded bg-white shadow-card p-5">
            <p className="text-primary font-semibold text-sm mb-2">Step 3</p>
            <h3 className="text-lg text-ink font-semibold mb-2">We ship to you</h3>
            <p className="text-sm text-muted">
              Dispatch from Nairobi with tracking snapshots emailed as your device clears QC.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
