import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const packages = await prisma.subscriptionPackage.findMany({
    orderBy: { priceMonthly: 'asc' },
    include: { _count: { select: { subscriptions: true } } },
  });
  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, priceMonthly, priceAnnual, durationDays, couponLimitPerPeriod, isActive, stripePriceIdMonthly } = body;
  if (!name || priceMonthly == null) return NextResponse.json({ error: 'name and priceMonthly required' }, { status: 400 });
  const pkg = await prisma.subscriptionPackage.create({
    data: { name, priceMonthly: Number(priceMonthly), priceAnnual: priceAnnual ? Number(priceAnnual) : null, durationDays: Number(durationDays || 30), couponLimitPerPeriod: Number(couponLimitPerPeriod || 5), isActive: Boolean(isActive ?? true), stripePriceIdMonthly: stripePriceIdMonthly || null },
  });
  return NextResponse.json({ pkg }, { status: 201 });
}
