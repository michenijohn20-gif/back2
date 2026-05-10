import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi.js";
import { formatKes } from "../../utils/format.js";
import { Btn } from "../../components/ui.jsx";

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 50 });
  const load = (page = meta.page) =>
    adminApi.get("/api/admin/products", { params: { page, pageSize: meta.pageSize } }).then((r) => {
      setProducts(r.data.products || []);
      setMeta({ total: r.data.total || 0, page: r.data.page || page, pageSize: r.data.pageSize || meta.pageSize });
    });

  useEffect(() => {
    load();
  }, []);

  const del = async (id) => {
    if (!window.confirm("Archive / delete permanently?")) return;
    await adminApi.delete(`/api/admin/products/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-ink">Products</h1>
        <p className="text-xs text-muted max-w-sm text-right">
          Create rich listings via Prisma Studio or POST /api/admin/products with Cloudinary-hosted image URLs during early catalog builds.
        </p>
      </div>
      <div className="overflow-auto border border-border rounded bg-white shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price (Ex)</th>
              <th className="p-3">Stock</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const v0 = p.variants?.[0];
              const stock =
                (v0?.stockExcellent || 0) + (v0?.stockGood || 0) + (v0?.stockFair || 0);
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <img
                      loading="lazy"
                      src={p.images?.[0]?.url || "/placeholder.svg"}
                      alt=""
                      className="h-12 w-12 object-cover rounded border border-border"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-ink">{p.name}</div>
                    <div className="text-xs text-muted">{p.brand?.name}</div>
                  </td>
                  <td className="p-3">{p.category?.name}</td>
                  <td className="p-3">{formatKes(v0?.priceExcellent || 0)}</td>
                  <td className="p-3">{stock}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-red-600 text-xs" onClick={() => del(p.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta.total > meta.pageSize && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <span className="text-muted">
            Page {meta.page} of {Math.max(1, Math.ceil(meta.total / meta.pageSize))}
          </span>
          <Btn variant="secondary" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>
            Previous
          </Btn>
          <Btn
            variant="secondary"
            disabled={meta.page >= Math.ceil(meta.total / meta.pageSize)}
            onClick={() => load(meta.page + 1)}
          >
            Next
          </Btn>
        </div>
      )}
    </div>
  );
}
