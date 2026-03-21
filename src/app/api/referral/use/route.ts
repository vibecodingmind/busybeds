import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
    }

    // Find user with this referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, fullName: true },
    });

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    // Can't use own referral code
    if (referrer.id === session.userId) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Check if user already used a referral code
    const existingUse = await prisma.referralUse.findUnique({
      where: { referredId: session.userId },
    });

    if (existingUse) {
      return NextResponse.json({ error: 'You have already used a referral code' }, { status: 400 });
    }

    // Create referral use record
    await prisma.referralUse.create({
      data: {
        referrerId: referrer.id,
        referredId: session.userId,
      },
    });

    // Get or create a free subscription for the referred user (7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find a free trial package or create one
    let freePackage = await prisma.subscriptionPackage.findFirst({
      where: { durationDays: 7 },
    });

    if (!freePackage) {
      // Create a 7-day free trial package if it doesn't exist
      freePackage = await prisma.subscriptionPackage.create({
        data: {
          name: 'Referral Bonus',
          priceMonthly: 0,
          durationDays: 7,
          couponLimitPerPeriod: 5,
          isActive: true,
        },
      });
    }

    // Create a subscription for the referred user
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.userId,
        packageId: freePackage.id,
        status: 'active',
        billingCycle: 'once',
        startsAt: new Date(),
        expiresAt: sevenDaysFromNow,
        compedBy: referrer.id,
        compedReason: `Referral from ${referrer.fullName}`,
      },
    });

    // Also give 7 days to the referrer if they have an active subscription
    const referrerSub = await prisma.subscription.findFirst({
      where: {
        userId: referrer.id,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });

    if (referrerSub) {
      const newExpiry = new Date(referrerSub.expiresAt);
      newExpiry.setDate(newExpiry.getDate() + 7);

      await prisma.subscription.update({
        where: { id: referrerSub.id },
        data: { expiresAt: newExpiry },
      });
    }

    return NextResponse.json({ ok: true, daysAdded: 7 });
  } catch (error) {
    console.error('Error applying referral code:', error);
    return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 });
  }
}
