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
      : pickDisplayPrice(product);

  const cheapestOption = pickCheapestOption(product);
  const defaultVariant = cheapestOption?.variant || product.variants?.[0];
  const itemCondition = product.displayCondition || cheapestOption?.condition || condition;

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

  const price = typeof displayPrice === "number" && displayPrice > 0 ? displayPrice : unit;

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
      <Link to={`/products/${product.slug}`} className="relative block aspect-square sm:aspect-[4/3] bg-surface">
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
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 rounded-full bg-white/90 border border-border text-muted hover:text-primary"
          aria-label="Wishlist"
        >
          {heartIcon(false)}
        </button>
      </Link>
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1.5 sm:gap-2">
        <div className="flex items-start justify-between gap-2">
          <ConditionBadge condition={itemCondition} />
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
  );
}

function pickDisplayPrice(product) {
  return pickCheapestOption(product)?.price || 0;
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
