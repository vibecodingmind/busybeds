export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/flash-deals?hotelId=xxx  — public: active flash deals for a hotel (or all active)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const now = new Date();

  const where: any = { isActive: true, startsAt: { lte: now }, endsAt: { gt: now } };
  if (hotelId) where.hotelId = hotelId;

  const deals = await prisma.flashDeal.findMany({
    where,
    include: { hotel: { select: { name: true, slug: true, coverImage: true, city: true, country: true } } },
    orderBy: { endsAt: 'asc' },
    take: 20,
  });

  return NextResponse.json({ deals });
}
