import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../lib/adminApi.js";
import { formatKes } from "../../utils/format.js";
import { TableSkeleton } from "../../components/LoadingState.jsx";

export function AdminCustomersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .get("/api/admin/customers")
      .then((r) => setRows(r.data.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-ink">Customers</h1>
      {loading ? (
        <TableSkeleton rows={7} columns={4} label="Loading customers..." />
      ) : (
        <div className="overflow-auto border border-border rounded bg-white shadow-card">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Email</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Spend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-semibold text-primary">
                    <Link to={`/admin/customers/${c.id}`}>{c.fullName}</Link>
                  </td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.orderCount}</td>
                  <td className="p-3">{formatKes(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
