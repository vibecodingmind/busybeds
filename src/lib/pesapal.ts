/**
 * Pesapal v3 API helper
 * Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
 */

const PESAPAL_BASE = (process.env.PESAPAL_MODE || process.env.PESAPAL_ENV) === 'live'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

export const hasPesapal = !!(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET);

/** Get a short-lived auth token */
async function getAuthToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Pesapal auth failed: ${JSON.stringify(data)}`);
  return data.token;
}

/**
 * Register IPN URL with Pesapal and return the IPN ID.
 * Pesapal returns the same ID if the URL is already registered.
 * Call this automatically before each order.
 */
export async function registerAndGetIpnId(ipnUrl: string): Promise<string> {
  const token = await getAuthToken();
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'GET' }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Pesapal IPN registration failed: ${JSON.stringify(data)}`);
  return data.ipn_id;
}

/** Submit an order and get a redirect URL */
export async function createPesapalOrder({
  orderId,
  amount,
  currency = 'USD',
  description,
  firstName,
  lastName,
  email,
  phone,
  callbackUrl,
  ipnId,
}: {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  callbackUrl: string;
  ipnId: string;
}) {
  const token = await getAuthToken();
  const res = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: orderId,
      currency,
      amount,
      description,
      callback_url: callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: email,
        phone_number: phone || '',
        first_name: firstName,
        last_name: lastName,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Pesapal order failed: ${JSON.stringify(data)}`);
  return { redirectUrl: data.redirect_url, orderTrackingId: data.order_tracking_id };
}

/** Check transaction status */
export async function getPesapalTransactionStatus(orderTrackingId: string) {
  const token = await getAuthToken();
  const res = await fetch(
    `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Pesapal status check failed: ${JSON.stringify(data)}`);
  return data;
}
