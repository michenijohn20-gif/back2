import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi.js";
import { formatKes } from "../../utils/format.js";
import { Btn } from "../../components/ui.jsx";

export function AdminOrdersPage() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ fulfillmentStatus: "", trackingNumber: "", adminNotes: "" });

  const load = () => {
    adminApi
      .get("/api/admin/orders", { params: { q: filter || undefined } })
      .then((r) => setRows(r.data.orders || []));
  };

  useEffect(() => {
    load();
  }, []);

  const open = async (id) => {
    const { data } = await adminApi.get(`/api/admin/orders/${id}`);
    setSelected(data);
    setForm({
      fulfillmentStatus: data.fulfillmentStatus,
      trackingNumber: data.trackingNumber || "",
      adminNotes: data.adminNotes || "",
    });
  };

  const save = async () => {
    if (!selected) return;
    await adminApi.patch(`/api/admin/orders/${selected.id}`, form);
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Orders</h1>
        <div className="flex gap-2">
          <input
            placeholder="Search number / phone / customer"
            className="border border-border rounded px-3 py-2 text-sm bg-white min-w-[220px]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Btn variant="secondary" onClick={load}>
            Search
          </Btn>
        </div>
      </div>
      <div className="overflow-auto border border-border rounded bg-white shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Delivery</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-border cursor-pointer" onClick={() => open(o.id)}>
                <td className="p-3 font-semibold text-primary">{o.orderNumber}</td>
                <td className="p-3">
                  <div>{o.guestName || o.user?.fullName}</div>
                  <div className="text-xs text-muted">{o.guestEmail || o.user?.email}</div>
                  <div className="text-xs text-muted">{o.guestPhone || o.user?.phone}</div>
                </td>
                <td className="p-3 text-xs text-body">
                  <div>{o.deliveryTown || "Not set"}</div>
                  <div className="text-muted">{o.deliveryCounty}</div>
                </td>
                <td className="p-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="p-3">{formatKes(o.totalAmount)}</td>
                <td className="p-3">{o.paymentStatus}</td>
                <td className="p-3">{o.fulfillmentStatus}</td>
                <td className="p-3 text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("en-KE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border border-border shadow-card max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{selected.orderNumber}</h2>
                <p className="text-xs text-muted">{new Date(selected.createdAt).toLocaleString("en-KE")}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Total</p>
                <p className="font-semibold text-ink">{formatKes(selected.totalAmount)}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded border border-border bg-surface p-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</p>
                <p className="font-semibold text-ink">{selected.guestName || selected.user?.fullName || "Guest"}</p>
                <p>{selected.guestEmail || selected.user?.email}</p>
                <p>{selected.guestPhone || selected.user?.phone || "No phone saved"}</p>
              </div>
              <div className="rounded border border-border bg-surface p-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Delivery address</p>
                <p className="font-semibold text-ink">{selected.deliveryTown}, {selected.deliveryCounty}</p>
                <p>{selected.deliveryBuilding || "No building/apartment"}</p>
                <p>{selected.deliveryStreet || "No street/road"}</p>
                <p className="text-xs text-muted">{selected.shippingMethod}</p>
              </div>
            </div>

            <div className="rounded border border-border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-surface text-left text-muted">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-2">
                        <p className="font-medium text-ink">{item.brandName} {item.productName}</p>
                        <p className="text-xs text-muted">{item.variantLabel} · {item.condition}</p>
                      </td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">{formatKes(item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="text-sm text-muted block">Fulfillment status</label>
            <select
              className="w-full border border-border rounded px-3 py-2 text-sm bg-white"
              value={form.fulfillmentStatus}
              onChange={(e) => setForm({ ...form, fulfillmentStatus: e.target.value })}
            >
              {["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label className="text-sm text-muted block">Tracking number</label>
            <input
              className="w-full border border-border rounded px-3 py-2 text-sm"
              value={form.trackingNumber}
              onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
            />
            <label className="text-sm text-muted block">Admin notes</label>
            <textarea
              className="w-full border border-border rounded px-3 py-2 text-sm"
              rows={4}
              value={form.adminNotes}
              onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Btn>
              <Btn onClick={save}>Save</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
