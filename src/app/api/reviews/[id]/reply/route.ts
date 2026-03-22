export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reply } = await req.json();
  if (!reply?.trim()) return NextResponse.json({ error: 'Reply text required' }, { status: 400 });

  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: { hotel: { include: { owner: { select: { userId: true } } } } },
    });

    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const s = session as any;
    const isOwner = (review as any).hotel?.owner?.userId === session.userId;
    const isAdmin = s.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only the hotel owner can reply' }, { status: 403 });
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: { ownerReply: reply.trim(), repliedAt: new Date() },
    });

    return NextResponse.json({ review: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
