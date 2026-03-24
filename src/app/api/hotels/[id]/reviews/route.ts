export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

type ReviewInput = z.infer<typeof reviewSchema>;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotelId = params.id;

    const reviews = await prisma.review.findMany({
      where: { hotelId },
      include: {
        user: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hotelId = params.id;
    const userId = session.userId;

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Check if user has a redeemed coupon for this hotel
    const redeemedCoupon = await prisma.coupon.findFirst({
      where: {
        userId,
        hotelId,
        status: 'redeemed',
      },
    });

    if (!redeemedCoupon) {
      return NextResponse.json(
        { error: 'You can only review hotels where you used a coupon' },
        { status: 403 }
      );
    }

    // Upsert review
    const review = await prisma.review.upsert({
      where: {
        hotelId_userId: {
          userId,
          hotelId,
        },
      },
      update: {
        rating: validatedData.rating,
        title: 'Review',
        body: validatedData.comment ?? '',
      },
      create: {
        rating: validatedData.rating,
        title: 'Review',
        body: validatedData.comment ?? '',
        userId,
        hotelId,
      },
    });

    // Recalculate and update hotel avgRating and reviewCount
    const agg = await prisma.review.aggregate({
      where: { hotelId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        avgRating: agg._avg.rating,
        reviewCount: agg._count.rating,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
