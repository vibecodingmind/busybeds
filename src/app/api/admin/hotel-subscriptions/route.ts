import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List all hotel subscriptions with filtering
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const tierId = searchParams.get('tierId');
  const search = searchParams.get('search');

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (tierId) where.tierId = tierId;

  const subscriptions = await prisma.hotelSubscription.findMany({
    where,
    include: {
      tier: true,
      hotel: {
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          coverImage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Filter by search if provided
  let filtered = subscriptions;
  if (search) {
    const s = search.toLowerCase();
    filtered = subscriptions.filter(sub => 
      sub.hotel.name.toLowerCase().includes(s) ||
      sub.hotel.city.toLowerCase().includes(s)
    );
  }

  return NextResponse.json({ subscriptions: filtered });
}

// POST - Create a subscription (for complimentary grants)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { hotelId, tierId, durationMonths, isComped, compedReason, billingCycle } = data;

  // Check if hotel already has an active subscription
  const existing = await prisma.hotelSubscription.findUnique({
    where: { hotelId },
  });

  if (existing && existing.status === 'active') {
    return NextResponse.json({ 
      error: 'Hotel already has an active subscription. Cancel it first.' 
    }, { status: 400 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (durationMonths || 1));

  const subscription = await prisma.hotelSubscription.create({
    data: {
      hotelId,
      tierId,
      status: 'active',
      billingCycle: billingCycle || 'monthly',
      startsAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      isComped: isComped ?? true,
      compedBy: session.userId,
      compedReason: compedReason || 'Granted by admin',
      usageResetAt: now,
    },
    include: {
      tier: true,
      hotel: { select: { name: true } },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'grant_subscription',
      resource: 'hotel_subscription',
      resourceId: subscription.id,
      metadata: JSON.stringify({
        hotelId,
        tierId,
        tierName: subscription.tier.displayName,
        hotelName: subscription.hotel.name,
        durationMonths,
        isComped,
      }),
    },
  });

  return NextResponse.json({ subscription });
}

// PATCH - Update subscription status
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { id, status, cancelAt } = data;

  const subscription = await prisma.hotelSubscription.update({
    where: { id },
    data: {
      status,
      cancelAt: cancelAt ? new Date(cancelAt) : null,
      canceledAt: status === 'canceled' ? new Date() : null,
    },
    include: {
      tier: true,
      hotel: { select: { name: true } },
    },
  });

  return NextResponse.json({ subscription });
}

// DELETE - Cancel subscription immediately
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const subscription = await prisma.hotelSubscription.update({
    where: { id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, subscription });
}
