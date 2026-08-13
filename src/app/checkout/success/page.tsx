import { completeCheckoutAction } from "@/lib/actions/app-actions";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; simulated?: string }>;
}) {
  const { planId } = await searchParams;
  if (planId) {
    await completeCheckoutAction(planId);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Membership activated</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You can now search hotels and request stays. QR codes are issued after availability is confirmed.
            </p>
            <ButtonLink href="/hotels" className="w-full justify-center">Browse hotels</ButtonLink>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
