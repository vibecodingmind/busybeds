export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailSubscriptionConfirmed } from '@/lib/email';

// POST /api/subscriptions/upgrade  — switch plans (upgrade or downgrade)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packageId, billingCycle = 'monthly' } = await req.json();
  if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 });

  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  const now = new Date();
  const currentSub = await prisma.subscription.findFirst({
    where: { userId: session.userId, status: 'active', expiresAt: { gt: now } },
    include: { package: true },
    orderBy: { expiresAt: 'desc' },
  });

  if (currentSub?.packageId === packageId && currentSub?.billingCycle === billingCycle) {
    return NextResponse.json({ error: 'You are already on this plan.' }, { status: 400 });
  }

  // Cancel current subscription
  if (currentSub) {
    await prisma.subscription.update({ where: { id: currentSub.id }, data: { status: 'cancelled' } });
  }

  // Create new subscription — start immediately
  const days = billingCycle === 'annual' ? 365 : pkg.durationDays;
  const expiresAt = new Date(now.getTime() + days * 86400000);

  const newSub = await prisma.subscription.create({
    data: {
      userId: session.userId,
      packageId,
      status: 'active',
      billingCycle,
      startsAt: now,
      expiresAt,
    },
    include: { package: true },
  });

  // Send confirmation email
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { fullName: true, email: true } });
  if (user) {
    const html = emailSubscriptionConfirmed(user.fullName, pkg.name, expiresAt);
    await sendEmail({
      to: user.email,
      subject: `🎉 Plan ${currentSub ? 'changed' : 'activated'} — ${pkg.name}`,
      html,
    }).catch(() => {});
  }

  const action = currentSub
    ? (pkg.priceMonthly > (currentSub.package as any).priceMonthly ? 'upgraded' : 'downgraded')
    : 'subscribed';

  return NextResponse.json({ ok: true, subscription: newSub, action });
}
