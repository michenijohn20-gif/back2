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
          <div className="bg-white rounded border border-border shadow-card max-w-lg w-full p-6 space-y-3">
            <h2 className="text-lg font-semibold text-ink">{selected.orderNumber}</h2>
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
