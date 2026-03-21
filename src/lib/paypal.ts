/**
 * PayPal REST API v2 helper
 * Docs: https://developer.paypal.com/api/rest/
 */

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export const hasPayPal = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

/** Get a short-lived access token */
async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description}`);
  return data.access_token;
}

/** Create a PayPal Product (called once per subscription plan) */
export async function createPayPalProduct(name: string, description: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, description, type: 'SERVICE', category: 'SOFTWARE' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal product creation failed: ${JSON.stringify(data)}`);
  return data;
}

/** Create a PayPal Billing Plan linked to a product */
export async function createPayPalPlan(
  productId: string,
  name: string,
  priceMonthly: number,
  currency = 'USD'
) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      product_id: productId,
      name,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // infinite
          pricing_scheme: {
            fixed_price: { value: priceMonthly.toFixed(2), currency_code: currency },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal plan creation failed: ${JSON.stringify(data)}`);
  return data;
}

/** Create a PayPal Subscription and return the approval URL */
export async function createPayPalSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  customId: string // userId:packageId
) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: customId,
      application_context: {
        brand_name: 'Busy Beds',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal subscription creation failed: ${JSON.stringify(data)}`);
  const approvalLink = data.links?.find((l: { rel: string }) => l.rel === 'approve');
  return { subscriptionId: data.id, approvalUrl: approvalLink?.href };
}

/** Get subscription details */
export async function getPayPalSubscription(subscriptionId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal get subscription failed: ${JSON.stringify(data)}`);
  return data;
}
