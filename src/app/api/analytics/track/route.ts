export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// POST /api/analytics/track - track user events
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  
  const { eventType, hotelId, couponId, metadata } = await req.json();
  if (!eventType) return NextResponse.json({ error: 'eventType required' }, { status: 400 });

  try {
    await prisma.analyticsEvent.create({
      data: {
        userId: session?.userId || null,
        eventType,
        hotelId: hotelId || null,
        couponId: couponId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (e) {
    console.error('Analytics error:', e);
  }

  return NextResponse.json({ ok: true });
}
