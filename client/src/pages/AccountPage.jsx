import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../lib/api";
import { Btn, BtnLink, ConditionBadge } from "../components/ui.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { useAuthStore } from "../store/authStore";
import { formatKes } from "../utils/format";
import { priceFor } from "../components/ProductCard.jsx";
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
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistBusyId, setWishlistBusyId] = useState("");
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

  const loadOrders = async () => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const o = await api.get("/api/account/orders", { headers });
    setOrders(o.data);
  };

  const loadWishlist = async () => {
    if (!accessToken) return;
    setWishlistLoading(true);
    const headers = { Authorization: `Bearer ${accessToken}` };
    try {
      const w = await api.get("/api/wishlist", { headers });
      setWishlist(w.data);
    } finally {
      setWishlistLoading(false);
    }
  };

  const loadAddresses = async () => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const a = await api.get("/api/addresses", { headers });
    setAddresses(a.data);
  };

  useEffect(() => {
    if (tab === "orders") loadOrders().catch(() => {});
    if (tab === "wishlist") loadWishlist().catch(() => {});
    if (tab === "addresses") loadAddresses().catch(() => {});
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
      loadAddresses();
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
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Saved shortlist</p>
                <h1 className="text-2xl font-semibold text-ink">Wishlist</h1>
                <p className="text-sm text-muted">
                  Compare saved devices and come back when you are ready to order.
                </p>
              </div>
              <BtnLink to="/products" variant="secondary">
                Browse catalogue
              </BtnLink>
            </div>

            {wishlistLoading ? (
              <div className="border border-border rounded bg-white shadow-card">
                <LoadingState label="Loading wishlist..." />
              </div>
            ) : wishlist.length === 0 ? (
              <div className="border border-dashed border-border rounded bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <span className="text-xl">♡</span>
                </div>
                <h2 className="text-lg font-semibold text-ink">No saved devices yet</h2>
                <p className="mt-1 text-sm text-muted">
                  Tap the heart on any listing to keep it here for later.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {wishlist.map((p) => (
                  <WishlistItem
                    key={p.id}
                    product={p}
                    removing={wishlistBusyId === p.id}
                    onRemove={async () => {
                      setWishlistBusyId(p.id);
                      try {
                        await api.delete(`/api/wishlist/${p.id}`, {
                          headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        setWishlist((items) => items.filter((item) => item.id !== p.id));
                      } catch {
                        window.alert("Could not remove this saved item.");
                      } finally {
                        setWishlistBusyId("");
                      }
                    }}
                  />
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

function WishlistItem({ product, removing, onRemove }) {
  const image = cleanImageUrl(product.images?.[0]?.url) || "/placeholder.svg";
  const cheapest = pickCheapestOption(product);
  const best = pickBestConditionOption(product);
  const variant = cheapest?.variant || product.variants?.[0];
  const spec = [variant?.storage, variant?.color].filter(Boolean).join(" · ");

  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 rounded border border-border bg-white p-3 shadow-card transition hover:border-primary/60">
      <Link to={`/products/${product.slug}`} className="block aspect-square overflow-hidden rounded border border-border bg-surface">
        <img
          loading="lazy"
          decoding="async"
          src={image}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
      </Link>
      <div className="min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <ConditionBadge condition={best?.condition || "EXCELLENT"} />
          <button
            type="button"
            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
            disabled={removing}
            onClick={onRemove}
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
        <Link to={`/products/${product.slug}`} className="block text-ink hover:text-primary">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">
            {product.brand?.name && <span className="text-body font-medium">{product.brand.name} </span>}
            {product.name}
          </p>
        </Link>
        {spec && <p className="line-clamp-1 text-xs text-muted">{spec}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-semibold text-ink">From {formatKes(cheapest?.price || 0)}</p>
          <Link to={`/products/${product.slug}`} className="text-xs font-semibold text-primary hover:underline">
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}

function cleanImageUrl(url = "") {
  const match = String(url).match(/^\s*([^|]+)\s*\|\s*(https?:\/\/.+)$/i);
  return (match ? match[2] : url).trim();
}

function stockFor(variant, condition) {
  if (!variant) return 0;
  const c = String(condition || "EXCELLENT").toUpperCase();
  return c === "GOOD" ? variant.stockGood : c === "FAIR" ? variant.stockFair : variant.stockExcellent;
}

function productOptions(product) {
  return (product.variants || [])
    .flatMap((variant) =>
      ["EXCELLENT", "GOOD", "FAIR"].map((condition) => ({
        variant,
        condition,
        price: priceFor(variant, condition),
        stock: stockFor(variant, condition),
      })),
    )
    .filter((option) => option.price > 0);
}

function pickCheapestOption(product) {
  const options = productOptions(product);
  return (
    options
      .filter((option) => option.stock > 0)
      .sort((a, b) => a.price - b.price)[0] || options.sort((a, b) => a.price - b.price)[0]
  );
}

function pickBestConditionOption(product) {
  const options = productOptions(product);
  const source = options.filter((option) => option.stock > 0);
  const candidates = source.length ? source : options;
  for (const condition of ["EXCELLENT", "GOOD", "FAIR"]) {
    const match = candidates
      .filter((option) => option.condition === condition)
      .sort((a, b) => a.price - b.price)[0];
    if (match) return match;
  }
  return null;
}
