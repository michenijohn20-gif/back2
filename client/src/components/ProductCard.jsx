import { useState } from "react";
import { Link } from "react-router-dom";
import { Btn, BtnLink } from "./ui.jsx";
import { ConditionBadge } from "./ui.jsx";
import { Spinner } from "./LoadingState.jsx";
import { formatKes } from "../utils/format";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";

function heartIcon(filled) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M20.8 8.9c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.7Z"
      />
    </svg>
  );
}

export function ProductCard({
  product,
  condition = "EXCELLENT",
  onAdd,
  dense = false,
}) {
  const image = product.images?.[0]?.url;
  const addItem = useCartStore((s) => s.addItem);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [wishlisted, setWishlisted] = useState(Boolean(product.isWishlisted));
  const [wishBusy, setWishBusy] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const cheapestOption = pickCheapestOption(product);
  const bestOption = pickBestConditionOption(product);
  const cartOption = cheapestOption || bestOption;
  const badgeCondition = bestOption?.condition || normalizeCondition(condition);
  const defaultVariant = cartOption?.variant || product.variants?.[0];
  const itemCondition = cartOption?.condition || normalizeCondition(condition);

  const spec =
    product.specLine ||
    [defaultVariant?.storage, defaultVariant?.color].filter(Boolean).join(" · ");

  const handleWish = async () => {
    if (wishBusy) return;
    try {
      if (!accessToken) {
        setShowLoginPrompt(true);
        return;
      }
      setWishBusy(true);
      if (wishlisted) {
        await api.delete(`/api/wishlist/${product.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setWishlisted(false);
      } else {
        await api.post(
          `/api/wishlist/${product.id}`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setWishlisted(true);
      }
    } catch (e) {
      if (e.response?.status === 401) {
        setShowLoginPrompt(true);
      } else {
        window.alert("Could not update wishlist.");
      }
    } finally {
      setWishBusy(false);
    }
  };

  const unit = priceFor(defaultVariant, itemCondition);

  const handleCart = () => {
    if (!defaultVariant?.id) return;
    const fn = onAdd || addItem;
    fn({
      productId: product.id,
      variantId: defaultVariant?.id,
      condition: itemCondition,
      name: `${product.brand?.name ? product.brand.name + " · " : ""}${product.name}`,
      image,
      spec,
      quantity: 1,
      unitPrice: unit,
    });
  };

  const price =
    typeof cheapestOption?.price === "number" && cheapestOption.price > 0
      ? cheapestOption.price
      : unit > 0
        ? unit
        : pickDisplayPrice(product);

  const handleImgFallback = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/placeholder.svg";
  };

  return (
    <>
      <div
        className={`flex flex-col h-full rounded border border-border bg-white shadow-card hover:shadow transition ${
          dense ? "" : ""
        }`}
      >
        <Link to={`/products/${product.slug}`} className="relative block aspect-square sm:aspect-[4/3] bg-surface">
          <img
            loading="lazy"
            decoding="async"
            src={image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover rounded-t"
            onError={handleImgFallback}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWish();
            }}
            className={`absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-card backdrop-blur transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              wishlisted
                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "border-border bg-white/95 text-body hover:border-primary hover:text-primary"
            }`}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            title={wishlisted ? "Saved" : "Save"}
            disabled={wishBusy}
          >
            {wishBusy ? <Spinner className="h-4 w-4" /> : heartIcon(wishlisted)}
          </button>
        </Link>
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1.5 sm:gap-2">
          <div className="flex items-start justify-between gap-2">
            <ConditionBadge condition={badgeCondition} />
          </div>
          <Link to={`/products/${product.slug}`} className="text-ink hover:text-primary">
            <p className="text-[13px] sm:text-sm font-semibold leading-snug line-clamp-2">
              {product.brand?.name && <span className="text-body font-medium">{product.brand.name} </span>}
              {product.name}
            </p>
          </Link>
          {spec && <p className="text-xs sm:text-sm text-muted line-clamp-1">{spec}</p>}
          <p className="text-sm sm:text-lg font-semibold text-ink mt-auto">From {formatKes(price)}</p>
          <Btn
            className="w-full px-2 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-[15px]"
            disabled={!defaultVariant?.id}
            onClick={handleCart}
          >
            Add to Cart
          </Btn>
        </div>
      </div>
      {showLoginPrompt && <WishlistLoginModal onClose={() => setShowLoginPrompt(false)} />}
    </>
  );
}

function WishlistLoginModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded border border-border bg-white p-6 shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-login-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          {heartIcon(true)}
        </div>
        <h2 id="wishlist-login-title" className="text-center text-xl font-semibold text-ink">
          Sign in to save this device
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Keep a shortlist of phones and laptops, then return to compare or order when ready.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <BtnLink to="/login" onClick={onClose}>
            Sign in
          </BtnLink>
          <BtnLink to="/register" variant="secondary" onClick={onClose}>
            Create account
          </BtnLink>
        </div>
        <button type="button" className="mt-4 w-full text-sm text-muted hover:text-ink" onClick={onClose}>
          Continue browsing
        </button>
      </div>
    </div>
  );
}

function pickDisplayPrice(product) {
  return pickCheapestOption(product)?.price || 0;
}

function normalizeCondition(condition) {
  const c = String(condition || "EXCELLENT").toUpperCase();
  return ["EXCELLENT", "GOOD", "FAIR"].includes(c) ? c : "EXCELLENT";
}

function pickCheapestOption(product) {
  const options = (product.variants || []).flatMap((variant) =>
    ["EXCELLENT", "GOOD", "FAIR"].map((condition) => ({
      variant,
      condition,
      price: priceFor(variant, condition),
      stock: stockFor(variant, condition),
    })),
  ).filter((option) => option.price > 0);
  return (
    options
      .filter((option) => option.stock > 0)
      .sort((a, b) => a.price - b.price)[0] || options.sort((a, b) => a.price - b.price)[0]
  );
}

function pickBestConditionOption(product) {
  const options = (product.variants || []).flatMap((variant) =>
    ["EXCELLENT", "GOOD", "FAIR"].map((condition) => ({
      variant,
      condition,
      price: priceFor(variant, condition),
      stock: stockFor(variant, condition),
    })),
  ).filter((option) => option.price > 0);
  const available = options.filter((option) => option.stock > 0);
  const source = available.length ? available : options;
  for (const condition of ["EXCELLENT", "GOOD", "FAIR"]) {
    const best = source
      .filter((option) => option.condition === condition)
      .sort((a, b) => a.price - b.price)[0];
    if (best) return best;
  }
  return null;
}

function stockFor(variant, condition) {
  if (!variant) return 0;
  const c = String(condition || "EXCELLENT").toUpperCase();
  return c === "GOOD"
    ? variant.stockGood
    : c === "FAIR"
      ? variant.stockFair
      : variant.stockExcellent;
}

export function priceFor(variant, condition) {
  if (!variant) return 0;
  const c = String(condition || "EXCELLENT").toUpperCase();
  return c === "GOOD"
    ? variant.priceGood
    : c === "FAIR"
      ? variant.priceFair
      : variant.priceExcellent;
}
