import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateHotelProfileFormAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function HotelProfilePage() {
  const user = await getCurrentUser();
  const hotelId = user?.contexts.find((c) => c.hotelId)?.hotelId;
  if (!hotelId) return null;

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Hotel profile</h1>
      <form action={updateHotelProfileFormAction} className="space-y-4">
        <input type="hidden" name="hotelId" value={hotel.id} />
        <div className="space-y-2">
          <Label>Description</Label>
          <Input name="description" value={hotel.description ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Amenities (comma-separated)</Label>
          <Input name="amenities" value={hotel.amenities.join(", ")} />
        </div>
        <Button type="submit">Save profile</Button>
      </form>
    </div>
  );
}
