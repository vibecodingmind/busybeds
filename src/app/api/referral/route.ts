export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { referralCode: true, email: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate referral code if doesn't exist
    if (!user.referralCode) {
      const firstName = user.fullName.split(' ')[0].toLowerCase();
      const randomPart = crypto.randomBytes(4).toString('hex');
      const newCode = `${firstName}-${randomPart}`;

      user = await prisma.user.update({
        where: { id: session.userId },
        data: { referralCode: newCode },
        select: { referralCode: true, email: true, fullName: true },
      });
    }

    // Count referrals for this user
    const referrals = await prisma.referralUse.findMany({
      where: { referrerId: session.userId },
    });

    const referralUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://busybeds.com'}/register?ref=${user.referralCode}`;

    return NextResponse.json({
      code: user.referralCode,
      referralUrl,
      totalReferrals: referrals.length,
      rewardedMonths: referrals.length, // Each referral gives 7 days which rounds to ~1 month
    });
  } catch (error) {
    console.error('Error getting referral info:', error);
    return NextResponse.json({ error: 'Failed to get referral info' }, { status: 500 });
  }
}
