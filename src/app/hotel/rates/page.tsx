import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createPricingRuleFormAction, submitRateForApprovalFormAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateSavings } from "@/lib/rates/discount";

export default async function HotelRatesPage() {
  const user = await getCurrentUser();
  const hotelId = user?.contexts.find((c) => c.hotelId)?.hotelId;
  if (!hotelId) return null;

  const rooms = await prisma.roomType.findMany({
    where: { hotelId },
    include: {
      pricingRules: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rates (STO + display rack)</h1>
      {rooms.map((room) => (
        <Card key={room.id}>
          <CardHeader>
            <CardTitle>{room.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {room.pricingRules.map((r) => {
              const s = calculateSavings(Number(r.rackAmount), Number(r.stoAmount));
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                  <span>
                    Rack ${Number(r.rackAmount)} · STO ${Number(r.stoAmount)} ({s.discountPercent}%) — {r.status}
                  </span>
                  {r.status === "DRAFT" && (
                    <form action={submitRateForApprovalFormAction}>
                      <input type="hidden" name="rateId" value={r.id} />
                      <Button type="submit" size="sm" variant="outline">Submit</Button>
                    </form>
                  )}
                </div>
              );
            })}
            <form action={createPricingRuleFormAction} className="grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="roomTypeId" value={room.id} />
              <input type="hidden" name="currency" value="USD" />
              <div><Label>Rack</Label><Input name="rackAmount" type="number" required /></div>
              <div><Label>STO</Label><Input name="stoAmount" type="number" required /></div>
              <div><Label>Valid from</Label><Input name="validFrom" type="date" required /></div>
              <div><Label>Valid to</Label><Input name="validTo" type="date" required /></div>
              <Button type="submit" className="sm:col-span-2">Add rate period</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
