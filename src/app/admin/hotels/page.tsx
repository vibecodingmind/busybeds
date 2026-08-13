import { prisma } from "@/lib/db";
import { approveHotelFormAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminHotelsPage() {
  const hotels = await prisma.hotel.findMany({
    where: { status: { in: ["PENDING_APPROVAL", "DRAFT"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hotel approvals</h1>
      <div className="space-y-4">
        {hotels.map((h) => (
          <Card key={h.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{h.name}</CardTitle>
                <Badge variant="outline">{h.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{h.city}, {h.country}</p>
            </CardHeader>
            <CardContent>
              <form action={approveHotelFormAction}>
                <input type="hidden" name="hotelId" value={h.id} />
                <Button type="submit">Approve hotel</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
