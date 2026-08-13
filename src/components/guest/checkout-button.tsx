"use client";

import { useState } from "react";
import { startCheckoutAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";

export function CheckoutButton({ planId }: { planId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await startCheckoutAction(planId);
    setLoading(false);
    if (res.url) window.location.href = res.url;
  }

  return (
    <Button onClick={handleCheckout} disabled={loading} className="w-full">
      Subscribe
    </Button>
  );
}
