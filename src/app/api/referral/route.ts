export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET — get or create user's referral code + stats
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let referral = await (prisma as any).referral.findFirst({
      where: { referrerId: session.userId, referredId: null },
    });

    if (!referral) {
      const code = generateCode();
      referral = await (prisma as any).referral.create({
        data: { referrerId: session.userId, code },
      });
    }

    const usedCount = await (prisma as any).referral.count({
      where: { referrerId: session.userId, referredId: { not: null } },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';
    return NextResponse.json({
      code: referral.code,
      link: `${appUrl}/register?ref=${referral.code}`,
      usedCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — apply referral code at registration (called internally)
export async function POST(req: NextRequest) {
  try {
    const { code, newUserId } = await req.json();
    if (!code || !newUserId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const referral = await (prisma as any).referral.findFirst({
      where: { code, referredId: null },
    });
    if (!referral) return NextResponse.json({ error: 'Invalid or used code' }, { status: 404 });

    // Mark referral as used
    await (prisma as any).referral.update({
      where: { id: referral.id },
      data: { referredId: newUserId, usedAt: new Date() },
    });

    // Award 100 points to referrer
    await awardPoints(referral.referrerId, 100, 'referral', 'Referral bonus — friend joined BusyBeds');

    // Award 50 points to new user
    await awardPoints(newUserId, 50, 'bonus', 'Welcome bonus — joined via referral');

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function awardPoints(userId: string, points: number, type: string, description: string) {
  await (prisma as any).loyaltyPoints.upsert({
    where: { userId },
    update: { points: { increment: points }, lifetime: { increment: points } },
    create: { userId, points, lifetime: points },
  }).catch(() => {});

  await (prisma as any).pointTransaction.create({
    data: { userId, points, type, description },
  }).catch(() => {});
}
