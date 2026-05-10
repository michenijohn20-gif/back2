import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi.js";
import { Btn } from "../../components/ui.jsx";

export function AdminSettingsPage() {
  const [vals, setVals] = useState({});

  useEffect(() => {
    adminApi.get("/api/admin/settings").then((r) => setVals(r.data));
  }, []);

  const save = async () => {
    await adminApi.post("/api/admin/settings", vals);
    window.alert("Settings saved.");
  };

  const row = (key, label, secret = false) => (
    <div key={key}>
      <label className="text-sm text-muted">{label}</label>
      <input
        type={secret ? "password" : "text"}
        className="mt-1 w-full border border-border rounded px-3 py-2 text-sm bg-white"
        value={vals[key] || ""}
        onChange={(e) => setVals({ ...vals, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink">Store settings</h1>
      <p className="text-sm text-muted">
        Values save to the Postgres `Setting` table. Production secrets belong in `.env`, but admins can jot
        shortcodes reference numbers here during onboarding.
      </p>
      <div className="border border-border rounded bg-white shadow-card p-6 space-y-4">
        {row("store_name", "Store name")}
        {row("contact_email", "Contact email")}
        {row("shipping_nairobi", "Nairobi shipping (KES)")}
        {row("shipping_upcountry", "Up-country shipping (KES)")}
        {row("mpesa_shortcode", "M-Pesa paybill/till shortcode")}
        {row("mpesa_passkey", "M-Pesa passkey/Lipa Na Mpesa passphrase", true)}
        {row("mpesa_consumer_key", "Daraja consumer key")}
        {row("mpesa_consumer_secret", "Daraja consumer secret", true)}
        {row("pesapal_consumer_key", "Pesapal consumer key")}
        {row("pesapal_consumer_secret", "Pesapal consumer secret", true)}
        <Btn onClick={save}>Save configuration</Btn>
      </div>
    </div>
  );
}
