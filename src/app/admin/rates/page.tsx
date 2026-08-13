import { prisma } from "@/lib/db";
import { approveRateFormAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateSavings } from "@/lib/rates/discount";

export default async function AdminRatesPage() {
  const rates = await prisma.pricingRule.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      roomType: { include: { hotel: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rate approvals</h1>
      <div className="space-y-4">
        {rates.map((r) => {
          const savings = calculateSavings(Number(r.rackAmount), Number(r.stoAmount));
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {r.roomType.hotel.name} — {r.roomType.name}
                </CardTitle>
                <p className="text-sm">
                  Rack ${Number(r.rackAmount)} · STO ${Number(r.stoAmount)} ·{" "}
                  {savings.discountPercent}% off
                </p>
              </CardHeader>
              <CardContent>
                <form action={approveRateFormAction}>
                  <input type="hidden" name="rateId" value={r.id} />
                  <Button type="submit">Approve rate</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
