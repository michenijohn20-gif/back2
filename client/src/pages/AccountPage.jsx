import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../lib/api";
import { Btn } from "../components/ui.jsx";
import { useAuthStore } from "../store/authStore";
import { formatKes } from "../utils/format";
import { ProductCard } from "../components/ProductCard.jsx";
import { isValidKenyaPhone } from "../utils/phone";

const tabs = [
  ["orders", "Orders"],
  ["wishlist", "Wishlist"],
  ["profile", "Profile"],
  ["addresses", "Addresses"],
  ["password", "Change password"],
];

export function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [addrForm, setAddrForm] = useState({
    label: "",
    fullName: "",
    phone: "",
    county: "Nairobi",
    townArea: "",
    building: "",
    street: "",
    isDefault: false,
  });
  const [counties, setCounties] = useState([]);

  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    api.get("/api/counties").then((r) => setCounties(r.data));
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    if (user) setProfile({ fullName: user.fullName, email: user.email, phone: user.phone || "" });
  }, [user, accessToken]);

  const load = async () => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [o, w, a] = await Promise.all([
      api.get("/api/account/orders", { headers }),
      api.get("/api/wishlist", { headers }),
      api.get("/api/addresses", { headers }),
    ]);
    setOrders(o.data);
    setWishlist(w.data);
    setAddresses(a.data);
  };

  useEffect(() => {
    load();
  }, [accessToken, tab]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const saveProfile = async () => {
    try {
      const { data } = await api.patch(
        "/api/account/profile",
        { fullName: profile.fullName, phone: profile.phone },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      useAuthStore.setState({ user: { ...user, ...data } });
      window.alert("Profile updated.");
    } catch {
      window.alert("Could not update profile.");
    }
  };

  const changePw = async () => {
    try {
      await api.post(
        "/api/account/change-password",
        { currentPassword: pw.current, newPassword: pw.next },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      window.alert("Password updated.");
      setPw({ current: "", next: "" });
    } catch (e) {
      window.alert(e.response?.data?.error || "Unable to update password.");
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    if (!isValidKenyaPhone(addrForm.phone)) {
      window.alert("Invalid Kenyan phone on address.");
      return;
    }
    try {
      await api.post("/api/addresses", addrForm, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setAddrForm({
        label: "",
        fullName: "",
        phone: "",
        county: "Nairobi",
        townArea: "",
        building: "",
        street: "",
        isDefault: false,
      });
      load();
    } catch {
      window.alert("Could not save address.");
    }
  };

  const statusColor = (s) => {
    const map = {
      PROCESSING: "bg-amber-50 text-amber-800 border-amber-200",
      CONFIRMED: "bg-blue-50 text-blue-800 border-blue-200",
      SHIPPED: "bg-indigo-50 text-indigo-800 border-indigo-200",
      DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200",
      CANCELLED: "bg-red-50 text-red-800 border-red-200",
    };
    return map[s] || "bg-surface text-body border-border";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="border border-border rounded bg-white shadow-card h-fit p-4 space-y-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`w-full text-left px-3 py-2 rounded text-sm ${
              tab === id ? "bg-[#EFF6FF] text-primary font-semibold" : "text-body hover:bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="w-full text-left px-3 py-2 rounded text-sm text-red-600"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Log out
        </button>
      </aside>

      <section className="space-y-4">
        {tab === "orders" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-ink">Orders</h1>
            {orders.length === 0 ? (
              <p className="text-sm text-muted">No orders yet — start with a refurb deal.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/account/orders/${o.orderNumber}`}
                    className="block border border-border rounded bg-white shadow-card p-4 hover:border-primary transition"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">{o.orderNumber}</p>
                        <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString("en-KE")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">{formatKes(o.totalAmount)}</p>
                        <span
                          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border ${statusColor(
                            o.fulfillmentStatus,
                          )}`}
                        >
                          {o.fulfillmentStatus}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "wishlist" && (
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-4">Wishlist</h1>
            {wishlist.length === 0 ? (
              <p className="text-sm text-muted">Save items with the heart icon while browsing.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {wishlist.map((p) => (
                  <div key={p.id} className="border border-border rounded bg-white shadow-card p-3 space-y-2">
                    <ProductCard product={p} />
                    <Btn
                      variant="ghost"
                      className="w-full text-red-600"
                      onClick={async () => {
                        await api.delete(`/api/wishlist/${p.id}`, {
                          headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        load();
                      }}
                    >
                      Remove
                    </Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="border border-border rounded bg-white shadow-card p-6 space-y-4 max-w-lg">
            <h1 className="text-2xl font-semibold text-ink">Profile</h1>
            <div>
              <label className="text-sm text-muted">Full name</label>
              <input
                className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Email</label>
              <input
                disabled
                className="mt-1 w-full border border-border rounded px-3 py-2 text-sm bg-surface text-muted"
                value={profile.email}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Phone</label>
              <input
                className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <Btn onClick={saveProfile}>Save changes</Btn>
          </div>
        )}

        {tab === "addresses" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-ink">Addresses</h1>
            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="border border-border rounded p-4 bg-white shadow-card text-sm space-y-1">
                  <p className="font-semibold text-ink">{a.fullName}</p>
                  <p>{a.phone}</p>
                  <p>
                    {a.building}, {a.townArea}
                  </p>
                  <p>{a.county}</p>
                  {a.isDefault && (
                    <span className="text-xs text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
            <form className="border border-border rounded p-6 bg-white shadow-card space-y-3 max-w-xl" onSubmit={addAddress}>
              <h2 className="font-semibold text-ink">Add address</h2>
              <input
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder="Label (Home, Office)"
                value={addrForm.label}
                onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
              />
              <input
                required
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder="Recipient name"
                value={addrForm.fullName}
                onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
              />
              <input
                required
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder="Phone"
                value={addrForm.phone}
                onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
              />
              <select
                className="w-full border border-border rounded px-3 py-2 text-sm bg-white"
                value={addrForm.county}
                onChange={(e) => setAddrForm({ ...addrForm, county: e.target.value })}
              >
                {counties.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                required
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder="Town / estate"
                value={addrForm.townArea}
                onChange={(e) => setAddrForm({ ...addrForm, townArea: e.target.value })}
              />
              <input
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder="Building / apartment"
                value={addrForm.building}
                onChange={(e) => setAddrForm({ ...addrForm, building: e.target.value })}
              />
              <input
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder="Street"
                value={addrForm.street}
                onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addrForm.isDefault}
                  onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                />
                Set as default
              </label>
              <Btn type="submit">Save address</Btn>
            </form>
          </div>
        )}

        {tab === "password" && (
          <div className="border border-border rounded bg-white shadow-card p-6 space-y-4 max-w-lg">
            <h1 className="text-2xl font-semibold text-ink">Change password</h1>
            <input
              type="password"
              className="w-full border border-border rounded px-3 py-2 text-sm"
              placeholder="Current password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
            <input
              type="password"
              className="w-full border border-border rounded px-3 py-2 text-sm"
              placeholder="New password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
            <Btn onClick={changePw}>Update password</Btn>
          </div>
        )}
      </section>
    </div>
  );
}
