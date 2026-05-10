import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Btn, BtnLink } from "../components/ui.jsx";
import { formatKes } from "../utils/format";
import { useCartStore } from "../store/cartStore";
import { ConditionBadge } from "../components/ui.jsx";

export function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const [rates, setRates] = useState({ nairobiRate: 350, upcountryRate: 600 });

  useEffect(() => {
    api
      .get("/api/shipping-rates")
      .then((r) => setRates(r.data))
      .catch(() => {});
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.unitPrice || 0) * i.quantity, 0),
    [items],
  );

  const defaultShip = rates.nairobiRate;
  const shipping = defaultShip;
  const total = subtotal + shipping;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink mb-8">Your cart</h1>
      {!items.length ? (
        <div className="border border-dashed border-border rounded p-12 text-center bg-surface">
          <p className="text-body mb-6">Your refurbishment shortlist is empty.</p>
          <BtnLink to="/products">Browse products</BtnLink>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.variantId}-${item.condition}`}
                className="flex gap-4 border border-border rounded bg-white shadow-card p-4"
              >
                <img
                  loading="lazy"
                  src={item.image || "/placeholder.svg"}
                  alt=""
                  className="w-24 h-24 object-cover rounded border border-border"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="flex-1 space-y-2">
                  <Link to={`/products`} className="font-semibold text-ink hover:text-primary">
                    {item.name}
                  </Link>
                  <div className="flex gap-2 flex-wrap text-sm text-muted">
                    <ConditionBadge condition={item.condition} />
                    {item.spec && <span>{item.spec}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="text-muted">Qty</label>
                    <button
                      type="button"
                      className="border border-border rounded px-2"
                      onClick={() => setQty(item.variantId, item.condition, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="border border-border rounded px-2"
                      onClick={() => setQty(item.variantId, item.condition, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-red-600 text-xs"
                      onClick={() => removeItem(item.variantId, item.condition)}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    {formatKes(item.unitPrice * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <aside className="border border-border rounded bg-white shadow-card h-fit p-5 space-y-3">
            <p className="font-semibold text-ink">Order summary</p>
            <div className="flex justify-between text-sm text-body">
              <span>Subtotal</span>
              <span>{formatKes(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-body">
              <span>Shipping (from checkout)</span>
              <span className="text-muted">Set at checkout</span>
            </div>
            <p className="text-xs text-muted">
              Nairobi same-county courier is {formatKes(rates.nairobiRate)}; elsewhere in Kenya ships at{" "}
              {formatKes(rates.upcountryRate)} flat.
            </p>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-ink">
              <span>Estimated</span>
              <span>{formatKes(subtotal + rates.nairobiRate)}+</span>
            </div>
            <BtnLink to="/checkout" className="w-full">
              Proceed to checkout
            </BtnLink>
          </aside>
        </div>
      )}
    </div>
  );
}
