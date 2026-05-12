import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import api from "../lib/api";
import { Btn } from "../components/ui.jsx";
import { ProductCard, priceFor } from "../components/ProductCard.jsx";
import { formatKes } from "../utils/format";
import { useCartStore } from "../store/cartStore";
import { ProductDetailSkeleton } from "../components/SkeletonGrid.jsx";

const CONDITION_GUIDE = [
  {
    key: "EXCELLENT",
    label: "Excellent",
    copy: "Closest to new: minimal wear, strong battery health and clean display.",
  },
  {
    key: "GOOD",
    label: "Good",
    copy: "Light signs of use, fully tested. May include tiny surface marks out of view.",
  },
  {
    key: "FAIR",
    label: "Fair",
    copy: "Noticeable cosmetic wear but mechanically sound for daily commuting in Kenya.",
  },
];

function uniqueOptions(rows, key) {
  return [...new Set((rows || []).map((row) => String(row?.[key] || "").trim()).filter(Boolean))];
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("description");
  const [activeImg, setActiveImg] = useState(0);
  const [condition, setCondition] = useState("EXCELLENT");
  const [variantId, setVariantId] = useState(null);
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/products/${slug}`)
      .then((r) => setDetail(r.data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!detail?.product?.variants?.length) return;
    if (!variantId) {
      const v0 = detail.product.variants[0];
      setVariantId(v0.id);
      setActiveImg(0);
    }
  }, [detail, variantId]);

  const variant = useMemo(() => {
    const v = detail?.product?.variants?.find((x) => x.id === variantId);
    return v || detail?.product?.variants?.[0];
  }, [detail, variantId]);

  const price = priceFor(variant, condition);
  const stock =
    condition === "GOOD"
      ? variant?.stockGood
      : condition === "FAIR"
        ? variant?.stockFair
        : variant?.stockExcellent;
  const availableToOrder = Number(stock) > 0;

  const helmetTitle = detail?.product?.metaTitle || `${detail?.product?.name} — RefurbKE`;
  const helmetDesc =
    detail?.product?.metaDescription ||
    detail?.product?.description?.slice?.(0, 160) ||
    "Certified refurbished electronics in Kenya";

  if (loading) return <ProductDetailSkeleton />;
  if (!detail?.product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-ink">Product unavailable</h1>
        <Btn onClick={() => navigate("/products")}>Browse catalog</Btn>
      </div>
    );
  }

  const p = detail.product;
  const allImages = p.images || [];
  const variantColor = String(variant?.color || "").trim().toLowerCase();
  const colorImages = variantColor
    ? allImages.filter((im) => String(im.color || "").trim().toLowerCase() === variantColor)
    : [];
  const visibleImages = colorImages.length ? colorImages : allImages;
  const images = visibleImages.map((im) => im.url);

  const specRows = Object.entries(p.specs || {});

  function addToCart() {
    addItem({
      productId: p.id,
      variantId: variant?.id,
      condition,
      name: `${p.brand?.name ? p.brand.name + " · " : ""}${p.name}`,
      image: images[0],
      spec: [variant?.storage, variant?.color].filter(Boolean).join(" · "),
      quantity: 1,
      unitPrice: price,
    });
  }

  function selectVariant(v) {
    setVariantId(v.id);
    setActiveImg(0);
  }

  function selectStorage(storage) {
    const variants = p.variants || [];
    const next =
      variants.find((v) => v.storage === storage && v.color === variant?.color) ||
      variants.find((v) => v.storage === storage);
    if (next) selectVariant(next);
  }

  function selectColor(color) {
    const variants = p.variants || [];
    const next =
      variants.find((v) => v.color === color && v.storage === variant?.storage) ||
      variants.find((v) => v.color === color);
    if (next) selectVariant(next);
  }

  const storageOptions = uniqueOptions(p.variants, "storage");
  const colorOptions = uniqueOptions(p.variants, "color");

  return (
    <>
      <Helmet>
        <title>{helmetTitle}</title>
        <meta name="description" content={helmetDesc} />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <nav className="text-xs text-muted flex flex-wrap gap-2">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">
            Products
          </Link>
          <span>/</span>
          <Link to={`/products?categories=${p.category.slug}`} className="hover:text-primary">
            {p.category.name}
          </Link>
          <span>/</span>
          <span className="text-body">{p.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-surface border border-border rounded overflow-hidden mb-4">
              <img
                loading="lazy"
                src={images[activeImg] || "/placeholder.svg"}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="flex gap-2 overflow-auto">
              {images.map((u, idx) => (
                <button
                  type="button"
                  key={u + idx}
                  onClick={() => setActiveImg(idx)}
                  className={`border rounded h-16 w-16 shrink-0 overflow-hidden ${
                    activeImg === idx ? "border-primary" : "border-border"
                  }`}
                >
                  <img
                    loading="lazy"
                    src={u}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted">{p.brand?.name}</p>
            <h1 className="text-3xl font-semibold text-ink leading-tight">{p.name}</h1>
            <div>
              <p className="text-sm font-semibold text-ink mb-2">Condition</p>
              <div className="grid grid-cols-3 gap-2">
              {CONDITION_GUIDE.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCondition(c.key)}
                  className={`text-left border rounded p-3 text-sm transition ${
                    condition === c.key
                      ? "border-primary bg-[#EFF6FF] ring-2 ring-primary/10"
                      : "border-border bg-white text-body hover:border-primary/60"
                  }`}
                >
                  <span
                    className={`mb-2 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      condition === c.key ? "border-primary bg-primary" : "border-muted"
                    }`}
                  >
                    {condition === c.key && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <span className={`block font-semibold ${condition === c.key ? "text-primary" : "text-ink"}`}>
                    {c.label}
                  </span>
                </button>
              ))}
              </div>
            </div>
            <p className="text-sm text-body">
              {CONDITION_GUIDE.find((c) => c.key === condition)?.copy}
            </p>
            <p className="text-3xl font-bold text-ink">{formatKes(price)}</p>
            {storageOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-ink mb-2">Storage</p>
                <div className="flex flex-wrap gap-2">
                  {storageOptions.map((storage) => (
                    <button
                      type="button"
                      key={storage}
                      onClick={() => selectStorage(storage)}
                      className={`px-3 py-2 border rounded-full text-sm ${
                        variant?.storage === storage ? "border-primary text-primary bg-white" : "border-border bg-white"
                      }`}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {colorOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-ink mb-2">Colour</p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => selectColor(color)}
                      className={`px-3 py-2 border rounded-full text-sm ${
                        variant?.color === color ? "border-primary text-primary bg-white" : "border-border bg-white"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-semibold ${availableToOrder ? "text-emerald-600" : "text-red-600"}`}>
                {availableToOrder ? "Available to order" : "Currently unavailable in this grade"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Btn className="px-6 py-3" disabled={!availableToOrder} onClick={addToCart}>
                Add to Cart
              </Btn>
              <Btn
                variant="secondary"
                className="px-6 py-3"
                disabled={!availableToOrder}
                onClick={() => {
                  addToCart();
                  navigate("/checkout");
                }}
              >
                Buy Now
              </Btn>
            </div>
            <p className="text-sm text-muted border border-dashed border-border rounded p-3 bg-surface">
              Usually ships within 5-9 business days anywhere in Kenya after we source, inspect, and clear your
              order.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-body border border-border rounded p-4 bg-white">
              <span>Verified refurbished</span>
              <span aria-hidden>·</span>
              <span>12-month RefurbKE warranty</span>
              <span aria-hidden>·</span>
              <span>30-day returns on eligible units</span>
            </div>
          </div>
        </div>

        <div className="border border-border rounded bg-white shadow-card">
          <div className="flex border-b border-border overflow-x-auto text-sm font-medium">
            {[
              ["description", "Description"],
              ["box", "What's in the box"],
              ["specs", "Specs"],
              ["guide", "Condition guide"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`px-5 py-3 whitespace-nowrap ${
                  tab === k ? "text-primary border-b-2 border-primary" : "text-body"
                }`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="p-5 text-sm text-body space-y-3">
            {tab === "description" && <p className="leading-relaxed whitespace-pre-line">{p.description}</p>}
            {tab === "box" && <p className="leading-relaxed whitespace-pre-line">{p.whatsInBox}</p>}
            {tab === "specs" && (
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {specRows.map(([key, val]) => (
                    <tr key={key} className="border-b border-border">
                      <td className="py-2 pr-4 text-muted">{key}</td>
                      <td className="py-2 text-ink">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "guide" && (
              <table className="w-full text-sm border border-border rounded overflow-hidden">
                <thead className="bg-surface">
                  <tr className="text-left">
                    <th className="p-2 border-b border-border">Grade</th>
                    <th className="p-2 border-b border-border">What it means</th>
                  </tr>
                </thead>
                <tbody>
                  {CONDITION_GUIDE.map((c) => (
                    <tr key={c.key} className="border-b border-border">
                      <td className="p-2 font-semibold text-ink">{c.label}</td>
                      <td className="p-2">{c.copy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink mb-4">Related devices</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {(detail.related || []).map((rp) => (
              <ProductCard key={rp.id} product={rp} condition={condition} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
