export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending'; // pending | approved | all

  const where: any = {};
  if (status === 'pending') where.isApproved = false;
  else if (status === 'approved') where.isApproved = true;

  try {
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
        hotel: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ reviews });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, action } = await req.json(); // action: 'approve' | 'reject'
  if (!id || !['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  try {
    if (action === 'reject') {
      await prisma.review.delete({ where: { id } });
    } else {
      await prisma.review.update({ where: { id }, data: { isApproved: true } });
      const review = await prisma.review.findUnique({ where: { id } });
      if (review) {
        // Recalculate hotel rating
        const stats = await prisma.review.aggregate({
          where: { hotelId: review.hotelId, isApproved: true },
          _avg: { rating: true }, _count: { rating: true },
        });
        await prisma.hotel.update({
          where: { id: review.hotelId },
          data: { avgRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null, reviewCount: stats._count.rating },
        }).catch(() => {});
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
