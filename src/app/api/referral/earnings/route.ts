export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/referral/earnings — summary of referral cash earnings
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const earnings = await prisma.referralEarning.findMany({
    where: { referrerId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  // Auto-upgrade pending → available when availableAt has passed
  const toUpdate = earnings.filter(e => e.status === 'pending' && e.availableAt <= now);
  if (toUpdate.length > 0) {
    await prisma.referralEarning.updateMany({
      where: { id: { in: toUpdate.map(e => e.id) }, status: 'pending', availableAt: { lte: now } },
      data: { status: 'available' },
    });
    toUpdate.forEach(e => { e.status = 'available'; });
  }

  const available = earnings.filter(e => e.status === 'available').reduce((s, e) => s + e.amount, 0);
  const pending   = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const paid      = earnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);

  const payouts = await prisma.referralPayout.findMany({
    where: { userId: session.userId },
    orderBy: { requestedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({ available, pending, paid, earnings, payouts });
}
