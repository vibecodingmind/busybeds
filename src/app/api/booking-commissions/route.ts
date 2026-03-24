export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { hotelId, platform, commissionRate, trackingUrl } = await req.json();

  const commission = await prisma.bookingCommission.upsert({
    where: { hotelId_platform: { hotelId, platform } },
    create: { hotelId, platform, commissionRate, trackingUrl },
    update: { commissionRate, trackingUrl },
  });

  return NextResponse.json({ commission }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');

  const commissions = await prisma.bookingCommission.findMany({
    where: hotelId ? { hotelId } : {},
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ commissions });
}
