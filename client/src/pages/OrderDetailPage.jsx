import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api, { setAuthToken } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { formatKes } from "../utils/format";
import { LoadingState } from "../components/LoadingState.jsx";

export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    api
      .get(`/api/account/orders/${orderNumber}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((r) => setOrder(r.data))
      .catch(() => setError("Could not load order"));
  }, [accessToken, orderNumber]);

  if (!accessToken) return <Navigate to="/login" replace />;
  if (error) return <p className="p-8 text-center text-red-600">{error}</p>;
  if (!order) return <LoadingState label="Loading order..." className="px-4 py-10" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Link to="/account" className="text-sm text-primary">
        ← Back to account
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-ink">{order.orderNumber}</h1>
        <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleString("en-KE")}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="border border-border rounded p-4 bg-white shadow-card space-y-1">
          <p className="font-semibold text-ink">Fulfillment</p>
          <p>{order.fulfillmentStatus}</p>
          <p className="text-muted">Payment: {order.paymentStatus}</p>
          {order.trackingNumber && (
            <p className="text-body">
              Tracking: <span className="font-mono">{order.trackingNumber}</span>
            </p>
          )}
        </div>
        <div className="border border-border rounded p-4 bg-white shadow-card space-y-1">
          <p className="font-semibold text-ink">Delivery snapshot</p>
          <p>
            {order.deliveryTown}, {order.deliveryCounty}
          </p>
          <p className="text-muted">{order.shippingMethod}</p>
        </div>
      </div>

      <div className="border border-border rounded bg-white shadow-card divide-y divide-border">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4">
            <img
              loading="lazy"
              src={item.imageUrl || "/placeholder.svg"}
              alt=""
              className="w-20 h-20 object-cover rounded border border-border"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-ink">
                {item.brandName} {item.productName}
              </p>
              <p className="text-muted">
                {item.variantLabel} · {item.condition}
              </p>
              <p>Qty {item.quantity}</p>
            </div>
            <div className="text-sm font-semibold text-ink">{formatKes(item.unitPrice * item.quantity)}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between border border-border rounded p-4 bg-surface text-sm">
        <span>Total</span>
        <span className="font-semibold text-ink">{formatKes(order.totalAmount)}</span>
      </div>
    </div>
  );
}
