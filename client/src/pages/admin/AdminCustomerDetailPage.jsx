import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../../lib/adminApi.js";
import { formatKes } from "../../utils/format.js";

export function AdminCustomerDetailPage() {
  const { id } = useParams();
  const [cust, setCust] = useState(null);

  useEffect(() => {
    adminApi.get(`/api/admin/customers/${id}`).then((r) => setCust(r.data));
  }, [id]);

  if (!cust) return <p className="text-muted p-6">Loading…</p>;

  return (
    <div className="space-y-4">
      <Link className="text-sm text-primary" to="/admin/customers">
        ← Customers
      </Link>
      <h1 className="text-2xl font-semibold text-ink">{cust.fullName}</h1>
      <p className="text-sm text-muted">{cust.email}</p>
      <div className="space-y-3">
        {cust.orders.map((o) => (
          <div key={o.id} className="border border-border rounded p-4 bg-white shadow-card text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">{o.orderNumber}</span>
              <span>{formatKes(o.totalAmount)}</span>
            </div>
            <div className="text-xs text-muted mt-2">{new Date(o.createdAt).toLocaleString("en-KE")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
