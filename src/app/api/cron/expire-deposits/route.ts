import { NextResponse } from "next/server";
import { expireDepositPendingBookings } from "@/lib/booking/booking-service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await expireDepositPendingBookings();
  return NextResponse.json({ expired: count });
}
