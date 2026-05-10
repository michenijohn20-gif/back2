import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminStore } from "../../store/adminStore.js";
import { usePersistHydrated } from "../../hooks/useStoreHydrated.js";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/customers", "Customers"],
  ["/admin/settings", "Settings"],
];

export function AdminLayout() {
  const admin = useAdminStore((s) => s.admin);
  const hydrate = useAdminStore((s) => s.hydrate);
  const logout = useAdminStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAdminStore((s) => s.token);
  const storageReady = usePersistHydrated(useAdminStore);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!storageReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-muted text-sm">
        Loading admin workspace…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[220px_1fr] bg-surface">
      <aside className="bg-white border-r border-border p-5 space-y-4">
        <p className="font-bold text-ink">
          Refurb<span className="text-primary">KE</span> Admin
        </p>
        <nav className="space-y-1 text-sm">
          {links.map(([to, label]) => (
            <Link key={to} to={to} className="block px-2 py-1 rounded hover:bg-surface">
              {label}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-muted border-t pt-3 space-y-1">
          <p>{admin?.email}</p>
          <button
            type="button"
            className="text-red-600"
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
}
