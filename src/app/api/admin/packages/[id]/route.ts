import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const allowed = ['name', 'priceMonthly', 'priceAnnual', 'durationDays', 'couponLimitPerPeriod', 'isActive', 'stripePriceIdMonthly'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) data[key] = key.startsWith('price') || key === 'durationDays' || key === 'couponLimitPerPeriod' ? (body[key] != null ? Number(body[key]) : null) : body[key]; }
  const pkg = await prisma.subscriptionPackage.update({ where: { id: params.id }, data });
  return NextResponse.json({ pkg });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const count = await prisma.subscription.count({ where: { packageId: params.id, status: 'active' } });
  if (count > 0) return NextResponse.json({ error: `Cannot delete: ${count} active subscribers` }, { status: 400 });
  await prisma.subscriptionPackage.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
