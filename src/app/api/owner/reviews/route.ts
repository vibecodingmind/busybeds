export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/owner/reviews  — get approved reviews for owner's hotel
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owner = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
  if (!owner) return NextResponse.json({ error: 'No hotel found' }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { hotelId: owner.hotelId, isApproved: true },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ reviews });
}

// PATCH /api/owner/reviews?id=xxx  — post/update owner reply
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const owner = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
  if (!owner) return NextResponse.json({ error: 'No hotel found' }, { status: 404 });

  // Ensure review belongs to owner's hotel
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.hotelId !== owner.hotelId) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const { reply } = await req.json();
  const updated = await prisma.review.update({
    where: { id },
    data: {
      ownerReply: reply?.trim() || null,
      repliedAt: reply?.trim() ? new Date() : null,
    },
  });

  return NextResponse.json({ review: updated });
}
