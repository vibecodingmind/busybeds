import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { hashQrToken } from "@/lib/coupons/qr";

export default async function VerifyTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const hash = hashQrToken(token);

  const booking = await prisma.stayBooking.findFirst({
    where: { qrTokenHash: hash },
    include: { hotel: true },
  });

  if (!booking?.couponCode) {
    return redirect("/hotel/verify");
  }

  redirect(`/hotel/verify?code=${booking.couponCode}`);
}
