export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [loyalty, transactions] = await Promise.all([
      (prisma as any).loyaltyPoints.findUnique({ where: { userId: session.userId } }).catch(() => null),
      (prisma as any).pointTransaction.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).catch(() => []),
    ]);

    return NextResponse.json({
      points: loyalty?.points ?? 0,
      lifetime: loyalty?.lifetime ?? 0,
      transactions,
    });
  } catch (e: any) {
    return NextResponse.json({ points: 0, lifetime: 0, transactions: [] });
  }
}
