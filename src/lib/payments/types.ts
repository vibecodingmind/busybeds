export interface CheckoutSession {
  id: string;
  url: string;
  provider: string;
}

export interface WebhookResult {
  subscriptionId?: string;
  status: "succeeded" | "failed" | "ignored";
  eventId: string;
}

export interface PaymentProvider {
  name: string;
  createSubscriptionCheckout(params: {
    userId: string;
    planId: string;
    planSlug: string;
    amount: number;
    currency: string;
    email: string;
  }): Promise<CheckoutSession>;
  handleWebhook?(payload: unknown, signature: string): Promise<WebhookResult>;
}
