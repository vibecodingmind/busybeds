export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [user, coupons, favorites, reviews] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, fullName: true, createdAt: true, role: true },
      }),
      (prisma as any).coupon?.findMany({ where: { userId: session.userId } }).catch(() => []),
      (prisma as any).favorite?.findMany({ where: { userId: session.userId } }).catch(() => []),
      (prisma as any).review?.findMany({ where: { userId: session.userId } }).catch(() => []),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      account: user,
      couponsUsed: coupons,
      savedHotels: favorites,
      reviews,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="busybeds-data-export-${session.userId}.json"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
