import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi.js";
import { formatKes } from "../../utils/format.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function AdminDashboardPage() {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    adminApi
      .get("/api/admin/dashboard")
      .then((r) => setDash(r.data))
      .catch(() => {});
  }, []);

  if (!dash)
    return <p className="text-muted">Pulling KPIs… Configure admin token via /admin/login if this hangs.</p>;

  const kpis = [
    { label: "Total Orders", val: dash.totalOrders },
    { label: "Revenue (Paid)", val: formatKes(dash.revenueKes) },
    { label: "Fulfillment backlog", val: dash.pendingOrders },
    { label: "Customers", val: dash.totalCustomers },
  ];

  const chartData = dash.ordersPerDay || [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-border rounded bg-white shadow-card p-5">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="text-3xl font-bold text-ink mt-2">{k.val}</p>
          </div>
        ))}
      </div>
      <div className="border border-border rounded bg-white shadow-card p-6 h-80">
        <p className="text-sm font-semibold text-ink mb-4">Paid orders per day · last ~30 window</p>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#9CA3AF" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
