export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createHash } from 'crypto';

// POST /api/affiliate-clicks  — track a click
export async function POST(req: NextRequest) {
  const { hotelId, platform } = await req.json();
  if (!hotelId || !platform) return NextResponse.json({ error: 'hotelId and platform required' }, { status: 400 });

  const session = await getSessionFromRequest(req);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

  await prisma.affiliateLinkClick.create({
    data: {
      hotelId,
      platform,
      userId: session?.userId ?? null,
      ipHash,
    },
  });

  return NextResponse.json({ ok: true });
}
