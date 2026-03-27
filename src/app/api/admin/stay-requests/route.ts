export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/** GET /api/admin/stay-requests — list all stay requests with filters */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const hotelId = searchParams.get('hotelId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (hotelId) where.hotelId = hotelId;

  const [requests, total] = await Promise.all([
    prisma.stayRequest.findMany({
      where,
      include: {
        hotel: { select: { id: true, name: true, city: true, country: true } },
        roomType: { select: { name: true, pricePerNight: true } },
        traveler: { select: { id: true, fullName: true, email: true, phone: true } },
        coupon: { select: { id: true, code: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stayRequest.count({ where }),
  ]);

  // Revenue stats
  const stats = await prisma.stayRequest.aggregate({
    where: { status: { in: ['paid', 'confirmed', 'completed'] } },
    _sum: { depositAmount: true, platformFeeAmount: true, hotelReceives: true, totalStayCost: true },
    _count: { id: true },
  });

  return NextResponse.json({
    requests,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalRequests: stats._count.id,
      totalDeposits: stats._sum.depositAmount || 0,
      platformRevenue: stats._sum.platformFeeAmount || 0,
      hotelPayouts: stats._sum.hotelReceives || 0,
      totalStayValue: stats._sum.totalStayCost || 0,
    },
  });
}
