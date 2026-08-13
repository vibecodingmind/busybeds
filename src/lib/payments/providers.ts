import type { PaymentProvider, CheckoutSession } from "@/lib/payments/types";

/** Simulated checkout for MVP — activates subscription on success page. */
export class SimulatedPaymentProvider implements PaymentProvider {
  name = "simulated";

  async createSubscriptionCheckout(params: {
    userId: string;
    planId: string;
    planSlug: string;
    amount: number;
    currency: string;
    email: string;
  }): Promise<CheckoutSession> {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = `${base}/checkout/success?planId=${params.planId}&simulated=1`;
    return { id: `sim_${params.userId}_${params.planId}`, url, provider: this.name };
  }
}

export class StripePaymentProvider implements PaymentProvider {
  name = "stripe";

  async createSubscriptionCheckout(params: {
    userId: string;
    planId: string;
    planSlug: string;
    amount: number;
    currency: string;
    email: string;
  }): Promise<CheckoutSession> {
    if (!process.env.STRIPE_SECRET_KEY) {
      return new SimulatedPaymentProvider().createSubscriptionCheckout(params);
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: params.email,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: Math.round(params.amount * 100),
            product_data: {
              name: `BusyBeds ${params.planSlug} Membership`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { userId: params.userId, planId: params.planId },
      success_url: `${base}/checkout/success?planId=${params.planId}`,
      cancel_url: `${base}/checkout/cancel`,
    });

    return {
      id: session.id,
      url: session.url ?? `${base}/checkout/cancel`,
      provider: this.name,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentProvider();
  }
  return new SimulatedPaymentProvider();
}
