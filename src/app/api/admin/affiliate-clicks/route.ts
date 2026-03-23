export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/admin/affiliate-clicks?days=30  — admin report
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = Number(new URL(req.url).searchParams.get('days') || 30);
  const since = new Date(Date.now() - days * 86400000);

  const clicks = await prisma.affiliateLinkClick.groupBy({
    by: ['hotelId', 'platform'],
    where: { clickedAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 100,
  });

  // Enrich with hotel names
  const hotelIds = Array.from(new Set(clicks.map(c => c.hotelId)));
  const hotels = await prisma.hotel.findMany({
    where: { id: { in: hotelIds } },
    select: { id: true, name: true },
  });
  const hotelMap = Object.fromEntries(hotels.map(h => [h.id, h.name]));

  const total = await prisma.affiliateLinkClick.count({ where: { clickedAt: { gte: since } } });

  const result = clicks.map(c => ({
    hotelId: c.hotelId,
    hotelName: hotelMap[c.hotelId] || 'Unknown',
    platform: c.platform,
    clicks: c._count.id,
  }));

  return NextResponse.json({ total, clicks: result, days });
}
