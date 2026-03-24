export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailWeeklyDigest } from '@/lib/email';

// POST /api/admin/weekly-digest — send weekly deals digest to all active subscribers
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);

  // New hotels added in last 7 days
  const newHotels = await prisma.hotel.findMany({
    where: { status: 'active', createdAt: { gte: oneWeekAgo } },
    include: { roomTypes: { take: 1 } },
    orderBy: { discountPercent: 'desc' },
    take: 5,
  });

  // Top deals (highest discount)
  const topDeals = await prisma.hotel.findMany({
    where: { status: 'active' },
    orderBy: { discountPercent: 'desc' },
    take: 5,
  });

  // Active subscribers with emails
  const subscribers = await prisma.subscription.findMany({
    where: { status: 'active', expiresAt: { gt: now } },
    include: { user: { select: { fullName: true, email: true } } },
    distinct: ['userId'],
  });

  const newHotelsData = newHotels.map(h => ({
    name: h.name,
    city: h.city,
    country: h.country,
    discount: h.discountPercent,
    slug: h.slug,
  }));

  const topDealsData = topDeals.map(h => ({
    name: h.name,
    city: h.city,
    discount: h.discountPercent,
    slug: h.slug,
  }));

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscribers.map(async sub => {
      try {
        await sendEmail({
          to: sub.user.email,
          subject: `🏨 Your Weekly BusyBeds Hotel Deals`,
          html: emailWeeklyDigest(sub.user.fullName, newHotelsData, topDealsData),
        });
        sent++;
      } catch {
        failed++;
      }
    })
  );

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
