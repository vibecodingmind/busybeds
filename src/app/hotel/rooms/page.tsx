import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createRoomTypeFormAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HotelRoomsPage() {
  const user = await getCurrentUser();
  const hotelId = user?.contexts.find((c) => c.hotelId)?.hotelId;
  if (!hotelId) return null;

  const rooms = await prisma.roomType.findMany({
    where: { hotelId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Room types</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>{r.name}</CardTitle>
              <CardContent className="p-0 text-sm text-muted-foreground">{r.description}</CardContent>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Add room type</CardTitle></CardHeader>
        <CardContent>
          <form action={createRoomTypeFormAction} className="space-y-3">
            <input type="hidden" name="hotelId" value={hotelId} />
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" />
            </div>
            <Button type="submit">Add room</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
