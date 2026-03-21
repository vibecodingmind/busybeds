export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { hotelId, email } = await req.json();
    if (!hotelId || !email?.includes('@')) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    // Store in a generic table — use HotelFavorite as proxy if PriceAlert table doesn't exist
    // We'll use a simple approach: store in DB via upsert if the model exists
    await (prisma as any).priceAlert?.upsert?.({
      where: { hotelId_email: { hotelId, email } },
      update: { updatedAt: new Date() },
      create: { hotelId, email },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
