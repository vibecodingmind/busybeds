import { getCurrentUser } from "@/lib/auth/session";
import { VerifyMemberForm } from "@/components/hotel/verify-member-form";

export default async function HotelVerifyPage() {
  const user = await getCurrentUser();
  const hotelId = user?.contexts.find((c) => c.hotelId)?.hotelId;

  if (!hotelId) {
    return <p>No hotel context assigned.</p>;
  }

  return <VerifyMemberForm hotelId={hotelId} />;
}
