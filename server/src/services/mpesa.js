import axios from "axios";
import "dotenv/config";

const BASE =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("M-Pesa consumer credentials missing");
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const { data } = await axios.get(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return data.access_token;
}

/** STK Lipa Na M-Pesa Online */
export async function stkPush({ amount, phone254, accountReference, transactionDesc }) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackURL = process.env.MPESA_CALLBACK_URL;
  if (!shortcode || !passkey) throw new Error("M-Pesa shortcode/passkey missing");

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/gi, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(Number(amount)),
    PartyA: phone254,
    PartyB: shortcode,
    PhoneNumber: phone254,
    CallBackURL: callbackURL || `${process.env.SERVER_PUBLIC_URL}/api/payments/mpesa/callback`,
    AccountReference: String(accountReference).slice(0, 12),
    TransactionDesc: String(transactionDesc || "RefurbKE Order").slice(0, 13),
  };

  const { data } = await axios.post(`${BASE}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return data;
}

/** Query STK transaction using CheckoutRequestID */
export async function queryStkCheckout(checkoutRequestId) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/gi, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };
  const { data } = await axios.post(`${BASE}/mpesa/stkpushquery/v1/query`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return data;
}

export function mapStkQueryToPaid(resp) {
  const code = resp?.ResultCode ?? resp?.resultCode;
  const desc = (resp?.ResultDesc || resp?.resultDesc || "").toLowerCase();
  if (code === 0) return true;
  if (String(code) === "0") return true;
  if (desc.includes("success")) return true;
  return false;
}
