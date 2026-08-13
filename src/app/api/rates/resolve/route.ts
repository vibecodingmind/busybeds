import { NextResponse } from "next/server";
import { resolveRateForStay } from "@/lib/rates/rate-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomTypeId = searchParams.get("roomTypeId");
  const dateStr = searchParams.get("date");

  if (!roomTypeId || !dateStr) {
    return NextResponse.json({ error: "roomTypeId and date required" }, { status: 400 });
  }

  const rate = await resolveRateForStay(roomTypeId, new Date(dateStr));
  if (!rate) {
    return NextResponse.json({ error: "No rate found" }, { status: 404 });
  }

  return NextResponse.json(rate);
}
