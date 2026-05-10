import { Link } from "react-router-dom";
import { Btn } from "./ui.jsx";
import { ConditionBadge } from "./ui.jsx";
import { formatKes } from "../utils/format";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";

function heartIcon(filled) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        d="M21 12.5c0 4.5-7 9-7 9s-7-4.5-7-9a5 5 0 018-4 5 5 0 017.5 3.5"
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
  const auth = useAuthStore((s) => s.accessToken);

  const displayPrice =
    typeof product.displayPrice === "number" && product.displayPrice > 0
      ? product.displayPrice
      : pickDisplayPrice(product, condition);

  const defaultVariant =
    product.variants?.find(
      (v) =>
        (condition === "EXCELLENT" && v.stockExcellent > 0) ||
        (condition === "GOOD" && v.stockGood > 0) ||
        (condition === "FAIR" && v.stockFair > 0),
    ) || product.variants?.[0];

  const spec =
    product.specLine ||
    [defaultVariant?.storage, defaultVariant?.color].filter(Boolean).join(" · ");

  const handleWish = async () => {
    try {
      if (!auth) {
        window.alert("Login to save favourites.");
        return;
      }
      await api.post(`/api/wishlist/${product.id}`);
    } catch {
      window.alert("Could not update wishlist.");
    }
  };

  const unit = priceFor(defaultVariant, condition);

  const handleCart = () => {
    if (!defaultVariant?.id) return;
    const fn = onAdd || addItem;
    fn({
      productId: product.id,
      variantId: defaultVariant?.id,
      condition,
      name: `${product.brand?.name ? product.brand.name + " · " : ""}${product.name}`,
      image,
      spec,
      quantity: 1,
      unitPrice: unit,
    });
  };

  const price =
    typeof displayPrice === "number" && displayPrice > 0 ? displayPrice : unit;

  const handleImgFallback = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/placeholder.svg";
  };

  return (
    <div
      className={`flex flex-col h-full rounded border border-border bg-white shadow-card hover:shadow transition ${
        dense ? "" : ""
      }`}
    >
      <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] bg-surface">
        <img
          loading="lazy"
          src={image || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover rounded-t"
          onError={handleImgFallback}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleWish();
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 border border-border text-muted hover:text-primary"
          aria-label="Wishlist"
        >
          {heartIcon(false)}
        </button>
      </Link>
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <ConditionBadge condition={condition} />
        </div>
        <Link to={`/products/${product.slug}`} className="text-ink hover:text-primary">
          <p className="text-sm font-semibold leading-snug line-clamp-2">
            {product.brand?.name && <span className="text-body font-medium">{product.brand.name} </span>}
            {product.name}
          </p>
        </Link>
        {spec && <p className="text-sm text-muted line-clamp-1">{spec}</p>}
        <p className="text-lg font-semibold text-ink mt-auto">{formatKes(price)}</p>
        <Btn className="w-full" disabled={!defaultVariant?.id} onClick={handleCart}>
          Add to Cart
        </Btn>
      </div>
    </div>
  );
}

function pickDisplayPrice(product, condition) {
  const cond = condition || "EXCELLENT";
  const variants = product.variants || [];
  let min = Infinity;
  for (const v of variants) {
    const p = priceFor(v, cond);
    if (p < min) min = p;
  }
  return Number.isFinite(min) ? min : 0;
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
