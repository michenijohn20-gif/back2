import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaystackPayment } from "react-paystack";
import api, { setAuthToken } from "../lib/api";
import { Btn } from "../components/ui.jsx";
import { formatKes } from "../utils/format";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { isValidKenyaPhone } from "../utils/phone";

const PAYSTACK_PUBLIC_KEY =
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_your_public_key_here";

function deliveryMethodForCounty(county) {
  return county === "Nairobi" ? "NAIROBI" : "UPCOUNTRY";
}

function paystackReference(orderNumber) {
  const safeOrder = String(orderNumber || "ORDER").replace(/[^a-zA-Z0-9=. -]/g, "").replace(/\s+/g, "");
  return `RK-${safeOrder}-${Date.now()}`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initializePayment = usePaystackPayment({ publicKey: PAYSTACK_PUBLIC_KEY });

  const [step, setStep] = useState(1);
  const [counties, setCounties] = useState([]);
  const [rates, setRates] = useState({ nairobiRate: 350, upcountryRate: 600 });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    county: "Nairobi",
    townArea: "",
    building: "",
    street: "",
    deliveryMethod: "NAIROBI",
  });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);

    let stopped = false;
    Promise.all([api.get("/api/counties"), api.get("/api/shipping-rates")])
      .then(([countyRes, rateRes]) => {
        if (stopped) return;
        setCounties(countyRes.data || []);
        setRates(rateRes.data || { nairobiRate: 350, upcountryRate: 600 });
      })
      .catch(() => {});

    return () => {
      stopped = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: user.fullName || f.fullName,
        email: user.email || f.email,
        phone: user.phone || f.phone,
      }));
    }
  }, [user]);

  const applyAddress = (address) => {
    if (!address) return;
    setForm((f) => ({
      ...f,
      fullName: address.fullName || f.fullName,
      phone: address.phone || f.phone,
      county: address.county || f.county,
      townArea: address.townArea || "",
      building: address.building || "",
      street: address.street || "",
      deliveryMethod: deliveryMethodForCounty(address.county),
    }));
  };

  useEffect(() => {
    if (!accessToken) return;
    let stopped = false;
    api
      .get("/api/addresses", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => {
        if (stopped) return;
        const list = Array.isArray(r.data) ? r.data : [];
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) || list[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setForm((f) => {
            if (f.townArea || f.building || f.street) return f;
            return {
              ...f,
              fullName: preferred.fullName || f.fullName,
              phone: preferred.phone || f.phone,
              county: preferred.county || f.county,
              townArea: preferred.townArea || "",
              building: preferred.building || "",
              street: preferred.street || "",
              deliveryMethod: deliveryMethodForCounty(preferred.county),
            };
          });
        }
      })
      .catch(() => {});

    return () => {
      stopped = true;
    };
  }, [accessToken]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.unitPrice || 0) * i.quantity, 0),
    [items],
  );

  const shippingAmount =
    form.deliveryMethod === "NAIROBI" ? rates.nairobiRate : rates.upcountryRate;
  const total = subtotal + shippingAmount;

  useEffect(() => {
    if (!items.length && !order) navigate("/cart");
  }, [items, order, navigate]);

  const validateStep1 = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!isValidKenyaPhone(form.phone)) e.phone = "Use 07... / 01... / +254...";
    if (!form.county) e.county = "Choose county";
    if (!form.townArea.trim()) e.townArea = "Enter town or estate";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onContinueStep1 = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const createOrder = async () => {
    const payload = {
      email: form.email,
      fullName: form.fullName,
      phone: form.phone,
      county: form.county,
      townArea: form.townArea,
      building: form.building,
      street: form.street,
      deliveryMethod:
        form.deliveryMethod === "NAIROBI"
          ? `Nairobi same-county (${formatKes(rates.nairobiRate)})`
          : `Rest of Kenya (${formatKes(rates.upcountryRate)})`,
      paymentMethod: "CARD",
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        condition: i.condition,
      })),
    };
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const r = await api.post("/api/orders", payload, { headers });
    return r.data;
  };

  const confirmPaystackPayment = async (referencePayload, ord) => {
    const reference =
      referencePayload?.reference || referencePayload?.trxref || referencePayload?.trans || referencePayload;

    if (!reference) {
      setBusy(false);
      setPaymentState("failed");
      setPaymentMessage("Paystack did not return a payment reference. Please try again.");
      return;
    }

    setPaymentState("verifying");
    setPaymentMessage("Verifying your payment with Paystack...");
    try {
      const { data } = await api.post("/api/payments/paystack/confirm", {
        orderId: ord.id,
        reference,
      });
      const paidOrder = data.order || ord;
      setOrder(paidOrder);
      clearCart();
      navigate(`/success?order=${encodeURIComponent(paidOrder.orderNumber || ord.orderNumber)}`);
    } catch (e) {
      setPaymentState("failed");
      setPaymentMessage(e.response?.data?.error || "Payment could not be verified. Please contact support.");
    } finally {
      setBusy(false);
    }
  };

  const openPaystack = (ord) => {
    const amount = Math.round(Number(ord.totalAmount || total) * 100);
    initializePayment({
      config: {
        email: user?.email || form.email,
        amount,
        currency: "KES",
        reference: paystackReference(ord.orderNumber),
        channels: ["card", "mobile_money"],
        metadata: {
          order_id: ord.id,
          order_number: ord.orderNumber,
          customer_name: form.fullName,
          phone: form.phone,
        },
      },
      onSuccess: (reference) => confirmPaystackPayment(reference, ord),
      onClose: () => {
        setBusy(false);
        setPaymentState("idle");
        setPaymentMessage("Payment was not completed.");
        window.alert("Payment was not completed. You can try again when ready.");
      },
    });
  };

  const onPay = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (PAYSTACK_PUBLIC_KEY.includes("your_public_key_here")) {
      window.alert("Add VITE_PAYSTACK_PUBLIC_KEY to the client environment before taking live payments.");
      return;
    }

    setBusy(true);
    setPaymentState("pending");
    setPaymentMessage("Preparing secure Paystack checkout...");
    try {
      const ord = order || (await createOrder());
      setOrder(ord);
      openPaystack(ord);
    } catch (err) {
      setBusy(false);
      setPaymentState("failed");
      setPaymentMessage(err.response?.data?.error || "Could not place order");
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex gap-3 text-sm text-muted flex-wrap">
        <span className={step >= 1 ? "text-primary font-semibold" : ""}>1. Contact & delivery</span>
        <span>/</span>
        <span className={step >= 2 ? "text-primary font-semibold" : ""}>2. Paystack payment</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <section className="border border-border rounded bg-white shadow-card p-5 sm:p-6 space-y-5">
          {step === 1 ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Checkout</p>
                <h1 className="text-2xl font-semibold text-ink mt-1">Contact & delivery</h1>
              </div>

              {addresses.length > 0 && (
                <div>
                  <label className="text-sm text-muted">Saved address</label>
                  <select
                    className="mt-1 w-full border border-border rounded px-3 py-2 text-sm bg-white"
                    value={selectedAddressId}
                    onChange={(e) => {
                      setSelectedAddressId(e.target.value);
                      applyAddress(addresses.find((a) => a.id === e.target.value));
                    }}
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label || a.fullName} - {a.townArea}, {a.county}
                        {a.isDefault ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Full name"
                  value={form.fullName}
                  onChange={(v) => setForm({ ...form, fullName: v })}
                  error={errors.fullName}
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  error={errors.email}
                  autoComplete="email"
                />
                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  error={errors.phone}
                  autoComplete="tel"
                />
                <div>
                  <label className="text-sm text-muted">County</label>
                  <select
                    className="mt-1 w-full border border-border rounded px-3 py-2 text-sm bg-white"
                    value={form.county}
                    onChange={(e) => {
                      const county = e.target.value;
                      setForm({
                        ...form,
                        county,
                        deliveryMethod: deliveryMethodForCounty(county),
                      });
                    }}
                  >
                    {counties.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  {errors.county && <p className="text-xs text-red-600 mt-1">{errors.county}</p>}
                </div>
              </div>

              <Field
                label="Town / estate area"
                value={form.townArea}
                onChange={(v) => setForm({ ...form, townArea: v })}
                error={errors.townArea}
                autoComplete="address-level3"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Building / apartment"
                  value={form.building}
                  onChange={(v) => setForm({ ...form, building: v })}
                  autoComplete="address-line2"
                />
                <Field
                  label="Street / road"
                  value={form.street}
                  onChange={(v) => setForm({ ...form, street: v })}
                  autoComplete="address-line1"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-ink mb-2">Delivery method</p>
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="radio"
                    checked={form.deliveryMethod === "NAIROBI"}
                    disabled={form.county !== "Nairobi"}
                    onChange={() => setForm({ ...form, deliveryMethod: "NAIROBI" })}
                  />
                  Nairobi same-county courier - {formatKes(rates.nairobiRate)}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={form.deliveryMethod === "UPCOUNTRY"}
                    onChange={() => setForm({ ...form, deliveryMethod: "UPCOUNTRY" })}
                  />
                  Rest of Kenya - {formatKes(rates.upcountryRate)}
                </label>
              </div>

              <Btn className="w-full sm:w-auto" onClick={onContinueStep1}>
                Continue to payment
              </Btn>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Paystack secure checkout</p>
                <h1 className="text-2xl font-semibold text-ink mt-1">Complete payment</h1>
                <p className="text-sm text-muted mt-1">Paystack will show the available card and M-Pesa options for this KES payment.</p>
              </div>

              <div className="rounded bg-surface border border-border p-4 text-sm space-y-2">
                <div className="flex justify-between text-body">
                  <span>Customer</span>
                  <span className="font-medium text-ink text-right">{form.fullName}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span>Contact</span>
                  <span className="font-medium text-ink text-right">{form.phone}</span>
                </div>
                <div className="flex justify-between text-body gap-4">
                  <span>Delivery</span>
                  <span className="font-medium text-ink text-right">
                    {form.townArea}, {form.county}
                  </span>
                </div>
                {selectedAddress && (
                  <p className="text-xs text-muted pt-1">
                    Using {selectedAddress.label || "saved address"}
                    {selectedAddress.isDefault ? " (default)" : ""}.
                  </p>
                )}
              </div>

              {order && (
                <div className="rounded border border-border bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">Order</p>
                  <p className="font-semibold text-ink mt-1">{order.orderNumber}</p>
                </div>
              )}

              {paymentMessage && (
                <div
                  className={`text-sm border rounded p-4 ${
                    paymentState === "failed"
                      ? "text-red-700 border-red-200 bg-red-50"
                      : "text-body border-dashed border-border bg-surface"
                  }`}
                >
                  {paymentMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Btn className="w-full sm:w-auto" disabled={busy} onClick={onPay}>
                  {busy ? "Processing..." : "Complete Payment"}
                </Btn>
                <button
                  type="button"
                  className="text-sm text-muted underline px-2 py-2"
                  disabled={busy}
                  onClick={() => {
                    setOrder(null);
                    setPaymentMessage("");
                    setStep(1);
                  }}
                >
                  Back to delivery
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="border border-border rounded bg-white shadow-card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Order summary</h2>
            <p className="text-sm text-muted">{items.length} item{items.length === 1 ? "" : "s"}</p>
          </div>
          <div className="space-y-3 max-h-72 overflow-auto pr-1">
            {items.map((item) => (
              <div key={`${item.variantId}-${item.condition}`} className="flex gap-3 text-sm">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt=""
                  className="h-14 w-14 rounded border border-border object-cover bg-surface"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink line-clamp-2">{item.name}</p>
                  <p className="text-xs text-muted">{item.quantity} x {formatKes(item.unitPrice)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-body">
              <span>Subtotal</span>
              <span>{formatKes(subtotal)}</span>
            </div>
            <div className="flex justify-between text-body">
              <span>Shipping</span>
              <span>{formatKes(shippingAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-ink text-base pt-2 border-t border-border">
              <span>Total due</span>
              <span>{formatKes(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, type = "text", autoComplete }) {
  return (
    <div>
      <label className="text-sm text-muted">{label}</label>
      <input
        type={type}
        autoComplete={autoComplete}
        className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
