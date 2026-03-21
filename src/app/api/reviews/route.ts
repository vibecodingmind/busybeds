export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/reviews?hotelId=xxx&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 });

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { hotelId, isApproved: true },
        include: { user: { select: { fullName: true, id: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { hotelId, isApproved: true } }),
    ]);

    // Rating breakdown
    const breakdown = await prisma.review.groupBy({
      by: ['rating'],
      where: { hotelId, isApproved: true },
      _count: { rating: true },
    });

    const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const b of breakdown) ratingMap[b.rating] = b._count.rating;

    return NextResponse.json({ reviews, total, pages: Math.ceil(total / limit), ratingBreakdown: ratingMap });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/reviews — submit a review
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Please sign in to leave a review' }, { status: 401 });

  try {
    const { hotelId, rating, title, body } = await req.json();

    if (!hotelId || !rating || !title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
    }

    // Check if user already reviewed this hotel
    const existing = await prisma.review.findUnique({
      where: { hotelId_userId: { hotelId, userId: session.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this hotel' }, { status: 409 });
    }

    // Check if user used a coupon for this hotel (verified review)
    const usedCoupon = await (prisma as any).couponUsage?.findFirst({
      where: { hotelId, userId: session.userId },
    }).catch(() => null);

    const review = await prisma.review.create({
      data: {
        hotelId,
        userId: session.userId,
        rating,
        title: title.trim(),
        body: body.trim(),
        isVerified: !!usedCoupon,
        isApproved: false, // requires moderation
      },
      include: { user: { select: { fullName: true, id: true } } },
    });

    // Update hotel avg rating
    await updateHotelRating(hotelId);

    return NextResponse.json({ review, message: 'Review submitted! It will appear after moderation.' }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'You have already reviewed this hotel' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function updateHotelRating(hotelId: string) {
  const stats = await prisma.review.aggregate({
    where: { hotelId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      avgRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
      reviewCount: stats._count.rating,
    },
  }).catch(() => {});
}
