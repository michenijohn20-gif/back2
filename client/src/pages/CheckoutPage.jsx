import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../lib/api";
import { Btn } from "../components/ui.jsx";
import { formatKes } from "../utils/format";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { isValidKenyaPhone } from "../utils/phone";

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [step, setStep] = useState(1);
  const [counties, setCounties] = useState([]);
  const [rates, setRates] = useState({ nairobiRate: 350, upcountryRate: 600 });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    county: "Nairobi",
    townArea: "",
    building: "",
    street: "",
    deliveryMethod: "NAIROBI",
    paymentMethod: "MPESA",
  });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [pollHint, setPollHint] = useState("");
  const [paymentState, setPaymentState] = useState("idle");

  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);
    api.get("/api/counties").then((r) => setCounties(r.data));
    api.get("/api/shipping-rates").then((r) => setRates(r.data));
  }, [accessToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("provider");
    const orderNumber = params.get("order");
    const reference = params.get("reference");
    if (provider !== "paystack" || !orderNumber) return;

    let stopped = false;
    setStep(2);
    setPaymentState("pending");
    setPollHint("Verifying card payment...");

    api
      .get(`/api/payments/paystack/status/${orderNumber}`, {
        params: reference ? { reference } : undefined,
      })
      .then((r) => {
        if (stopped) return;
        const status = r.data.status || r.data.paymentStatus;
        setOrder({ orderNumber, id: r.data.orderId });
        if (status === "paid" || status === "PAID") {
          setPaymentState("paid");
          clearCart();
          setStep(3);
        } else if (status === "failed" || status === "FAILED") {
          setPaymentState("failed");
          setPollHint(r.data.detail || "Card payment failed. Please try again.");
        } else {
          setPollHint("Card payment is still pending. Use the button below to check again.");
        }
      })
      .catch(() => {
        if (!stopped) {
          setPaymentState("failed");
          setPollHint("Could not verify card payment yet.");
        }
      });

    return () => {
      stopped = true;
    };
  }, [clearCart]);

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

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.unitPrice || 0) * i.quantity, 0),
    [items],
  );

  const shippingAmount =
    form.deliveryMethod === "NAIROBI" ? rates.nairobiRate : rates.upcountryRate;
  const total = subtotal + shippingAmount;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPaystackReturn = params.get("provider") === "paystack" && params.get("order");
    if (!items.length && !order && !isPaystackReturn) navigate("/cart");
  }, [items, order, navigate]);

  useEffect(() => {
    if (!order || step !== 2) return;
    let stopped = false;
    let attempts = 0;
    const id = setInterval(async () => {
      if (stopped) return;
      attempts += 1;
      if (attempts > 36) {
        clearInterval(id);
        setPaymentState("failed");
        setPollHint("Payment was not confirmed. Please try again or check your order later.");
        return;
      }
      try {
        const r =
          form.paymentMethod === "MPESA"
            ? await api.get(`/api/payments/mpesa/status/${order.orderNumber}`)
            : await api.get(`/api/payments/paystack/status/${order.orderNumber}`);
        const status = r.data.status || r.data.paymentStatus;
        if (status === "paid" || status === "PAID") {
          stopped = true;
          clearInterval(id);
          setPaymentState("paid");
          clearCart();
          setStep(3);
        }
        if (status === "failed" || status === "FAILED" || status === "cancelled") {
          stopped = true;
          clearInterval(id);
          setPaymentState(status === "cancelled" ? "cancelled" : "failed");
          setPollHint(r.data.daraja || r.data.detail || "M-Pesa payment failed. Please try again.");
        }
      } catch {
        /* ignore transient errors */
      }
    }, 5000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [order, step, form.paymentMethod, clearCart]);

  const validateStep1 = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!isValidKenyaPhone(form.phone)) e.phone = "Use 07… / 01… / +254…";
    if (!form.county) e.county = "Choose county";
    if (!form.townArea.trim()) e.townArea = "Enter town or estate";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const startMpesa = async (ord, phone) => {
    setPaymentState("pending");
    setPollHint("Check your phone for an M-Pesa prompt…");
    try {
      await api.post("/api/payments/mpesa/stk-push", {
        orderId: ord.id,
        phone,
      });
    } catch (e) {
      const error = e.response?.data?.error || "STK push failed — verify Daraja sandbox keys.";
      setPaymentState(error.toLowerCase().includes("cancelled") ? "cancelled" : "failed");
      setPollHint(error);
    }
  };

  const startPaystack = async (ord) => {
    setPaymentState("pending");
    setPollHint("Redirecting to secure card checkout...");
    try {
      const r = await api.post("/api/payments/paystack/create", { orderId: ord.id });
      if (r.data?.authorizationUrl) {
        window.location.assign(r.data.authorizationUrl);
      } else {
        setPaymentState("failed");
        setPollHint("Paystack did not return a checkout URL — verify API credentials.");
      }
    } catch (e) {
      setPaymentState("failed");
      setPollHint(e.response?.data?.error || "Paystack unavailable");
    }
  };

  const onContinueStep1 = () => {
    if (!validateStep1()) return;
    setMpesaPhone(form.phone);
    setStep(2);
  };

  const onPay = async () => {
    if (form.paymentMethod === "MPESA" && !isValidKenyaPhone(mpesaPhone || form.phone)) {
      window.alert("Enter a valid M-Pesa phone number");
      return;
    }
    setBusy(true);
    try {
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
        paymentMethod: form.paymentMethod,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          condition: i.condition,
        })),
      };
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const r = await api.post("/api/orders", payload, { headers });
      setOrder(r.data);
      setPaymentState("pending");
      if (form.paymentMethod === "MPESA") {
        await startMpesa(r.data, mpesaPhone || form.phone);
      } else {
        await startPaystack(r.data);
      }
    } catch (err) {
      window.alert(err.response?.data?.error || "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex gap-3 text-sm text-muted flex-wrap">
        <span className={step >= 1 ? "text-primary font-semibold" : ""}>1. Contact & delivery</span>
        <span>→</span>
        <span className={step >= 2 ? "text-primary font-semibold" : ""}>2. Payment</span>
        <span>→</span>
        <span className={step >= 3 ? "text-primary font-semibold" : ""}>3. Confirmation</span>
      </div>

      {step === 1 && (
        <div className="border border-border rounded bg-white shadow-card p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-ink">Contact & delivery</h1>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
              error={errors.fullName}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              error={errors.email}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              error={errors.phone}
            />
            <div>
              <label className="text-sm text-muted">County</label>
              <select
                className="mt-1 w-full border border-border rounded px-3 py-2 text-sm bg-white"
                value={form.county}
                onChange={(e) => setForm({ ...form, county: e.target.value })}
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
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Building / apartment"
              value={form.building}
              onChange={(v) => setForm({ ...form, building: v })}
            />
            <Field label="Street / road" value={form.street} onChange={(v) => setForm({ ...form, street: v })} />
          </div>

          <div>
            <p className="text-sm font-semibold text-ink mb-2">Delivery method</p>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input
                type="radio"
                checked={form.deliveryMethod === "NAIROBI"}
                onChange={() => setForm({ ...form, deliveryMethod: "NAIROBI" })}
              />
              Nairobi same-county courier — {formatKes(rates.nairobiRate)}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.deliveryMethod === "UPCOUNTRY"}
                onChange={() => setForm({ ...form, deliveryMethod: "UPCOUNTRY" })}
              />
              Rest of Kenya — {formatKes(rates.upcountryRate)}
            </label>
          </div>

          <div className="border-t border-border pt-4 flex justify-between text-sm text-body">
            <span>Subtotal</span>
            <span>{formatKes(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-body">
            <span>Shipping</span>
            <span>{formatKes(shippingAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Total due</span>
            <span>{formatKes(total)}</span>
          </div>
          <Btn className="w-full sm:w-auto" onClick={onContinueStep1}>
            Continue to payment
          </Btn>
        </div>
      )}

      {step === 2 && (
        <div className="border border-border rounded bg-white shadow-card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-ink">Payment</h2>

          {!order ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.paymentMethod === "MPESA"}
                  onChange={() => setForm({ ...form, paymentMethod: "MPESA" })}
                />
                M-Pesa STK Push
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.paymentMethod === "CARD"}
                  onChange={() => setForm({ ...form, paymentMethod: "CARD" })}
                />
                Card
              </label>

              {form.paymentMethod === "MPESA" && (
                <div>
                  <label className="text-sm text-muted">M-Pesa phone number</label>
                  <input
                    className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                  />
                </div>
              )}

              <div className="border-t border-border pt-3 text-sm text-body space-y-1">
                <div className="flex justify-between">
                  <span>Total due</span>
                  <span className="font-semibold text-ink">{formatKes(total)}</span>
                </div>
              </div>

              <Btn disabled={busy} onClick={onPay}>
                {busy ? "Processing…" : "Pay securely"}
              </Btn>
              <button type="button" className="text-sm text-muted ml-3 underline" onClick={() => setStep(1)}>
                Back
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-body">
                Order <span className="font-semibold text-ink">{order.orderNumber}</span> is pending payment
                confirmation.
              </p>
              {pollHint && (
                <div
                  className={`flex items-start gap-3 text-sm border rounded p-3 ${
                    ["failed", "cancelled"].includes(paymentState)
                      ? "text-red-700 border-red-200 bg-red-50"
                      : "text-body border-dashed border-border bg-surface"
                  }`}
                >
                  {["failed", "cancelled"].includes(paymentState) ? (
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-500 text-[10px] font-semibold shrink-0">
                      !
                    </span>
                  ) : (
                    <span className="mt-0.5 inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                  <span>{pollHint}</span>
                </div>
              )}
              <div className="flex gap-3 flex-wrap">
                {form.paymentMethod === "MPESA" && paymentState === "failed" ? (
                  <Btn variant="secondary" disabled={busy} onClick={() => startMpesa(order, mpesaPhone || form.phone)}>
                    Try M-Pesa again
                  </Btn>
                ) : form.paymentMethod === "MPESA" && paymentState === "cancelled" ? (
                  <Btn
                    variant="secondary"
                    onClick={() => {
                      setOrder(null);
                      setPaymentState("idle");
                      setPollHint("");
                    }}
                  >
                    Create a new order
                  </Btn>
                ) : (
                  <Btn
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const r =
                          form.paymentMethod === "CARD"
                            ? await api.get(`/api/payments/paystack/status/${order.orderNumber}`)
                            : await api.get(`/api/payments/mpesa/status/${order.orderNumber}`);
                        const status = r.data.status || r.data.paymentStatus;
                        if (status === "paid" || status === "PAID") {
                          clearCart();
                          setStep(3);
                        } else if (status === "failed" || status === "FAILED") {
                          setPaymentState("failed");
                          setPollHint(r.data.detail || "Payment failed. Please try again.");
                        } else {
                          window.alert("Payment not confirmed yet — finish payment or wait a few seconds.");
                        }
                      } catch {
                        window.alert("Could not verify payment yet.");
                      }
                    }}
                  >
                    I have completed my card payment
                  </Btn>
                )}
                <button type="button" className="text-sm text-muted underline" onClick={() => navigate("/account")}>
                  View orders
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && order && (
        <div className="border border-border rounded bg-white shadow-card p-6 space-y-3">
          <h2 className="text-xl font-semibold text-ink">You are all set</h2>
          <p className="text-body text-sm">
            Order <span className="font-semibold text-ink">{order.orderNumber}</span> is paid. We will email{" "}
            <span className="font-semibold">{form.email}</span> with dispatch updates.
          </p>
          <p className="text-sm text-muted">
            Deliveries across Kenya typically land within 5–9 business days once the unit clears final QC in
            Nairobi.
          </p>
          <Btn onClick={() => navigate("/account")}>Track in your account</Btn>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, error, type = "text" }) {
  return (
    <div>
      <label className="text-sm text-muted">{label}</label>
      <input
        type={type}
        className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
