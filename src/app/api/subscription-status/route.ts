export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * GET /api/subscription-status
 *
 * Returns the current user's subscription state used by the hotel page
 * to gate coupon generation and partner link access.
 *
 * Possible states:
 *   not_logged_in  — no valid auth session
 *   loading        — (client-side only; never returned here)
 *   no_sub         — logged in but no subscription record
 *   expired        — subscription exists but past expiresAt
 *   limit_reached  — active sub but monthly coupon cap hit
 *   active         — good to go
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ state: 'not_logged_in' });
  }

  const now = new Date();

  // Find the most recent subscription for this user
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId },
    include: { package: true },
    orderBy: { expiresAt: 'desc' },
  });

  if (!sub) {
    return NextResponse.json({ state: 'no_sub', email: session.email });
  }

  // Check if expired
  if (sub.status !== 'active' || sub.expiresAt <= now) {
    return NextResponse.json({
      state: 'expired',
      email: session.email,
      expiresAt: sub.expiresAt.toISOString(),
    });
  }

  // Active subscription — check coupon usage against monthly limit
  const couponsUsed = await prisma.coupon.count({
    where: {
      userId: session.userId,
      subscriptionId: sub.id,
      generatedAt: { gte: sub.startsAt },
    },
  });

  const limit = sub.package?.couponLimitPerPeriod ?? 5;
  if (couponsUsed >= limit) {
    return NextResponse.json({
      state: 'limit_reached',
      email: session.email,
      expiresAt: sub.expiresAt.toISOString(),
    });
  }

  return NextResponse.json({
    state: 'active',
    email: session.email,
    expiresAt: sub.expiresAt.toISOString(),
  });
}
