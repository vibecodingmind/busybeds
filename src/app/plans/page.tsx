import { getMembershipPlans } from "@/lib/subscription/service";

export const dynamic = "force-dynamic";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "@/components/guest/checkout-button";

export default async function PlansPage() {
  const plans = await getMembershipPlans();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Membership plans</h1>
        <p className="mt-2 text-muted-foreground">
          Coupon validity rules vary by package. Min stay 3 nights on hotel bookings.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-2xl font-bold">
                  ${Number(plan.priceAmount)}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
                </p>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>
                <CheckoutButton planId={plan.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
