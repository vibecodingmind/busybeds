import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      service: "busybeds",
      database: "connected",
    });
  } catch {
    // Return 200 so Railway liveness checks pass while Postgres is being linked.
    return NextResponse.json({
      status: "degraded",
      service: "busybeds",
      database: "disconnected",
    });
  }
}
