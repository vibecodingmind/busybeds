export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { rateLimit, getIp } from '@/lib/rateLimit';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Please sign in to redeem a gift card' }, { status: 401 });

  // Rate limit: 5 redemption attempts per 5 minutes per IP to prevent brute-force
  const ip = getIp(req);
  const rl = rateLimit(`giftcard-redeem:${ip}`, { limit: 5, windowSec: 300 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many redemption attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const { code } = await req.json();
    if (!code?.trim()) return NextResponse.json({ error: 'Gift card code required' }, { status: 400 });

    const card = await (prisma as any).giftCard.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!card) return NextResponse.json({ error: 'Invalid gift card code' }, { status: 404 });
    if (!card.isActive) return NextResponse.json({ error: 'This gift card has been deactivated' }, { status: 400 });
    if (card.balance <= 0) return NextResponse.json({ error: 'This gift card has no remaining balance' }, { status: 400 });
    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This gift card has expired' }, { status: 400 });
    }
    if (card.purchasedById === session.userId) {
      return NextResponse.json({ error: 'You cannot redeem your own gift card' }, { status: 400 });
    }

    // Mark as redeemed
    const updated = await (prisma as any).giftCard.update({
      where: { code: code.trim().toUpperCase() },
      data: {
        redeemedById: session.userId,
        redeemedAt: new Date(),
        balance: 0,
      },
    });

    // Award loyalty points equivalent
    await (prisma as any).loyaltyPoints?.upsert?.({
      where: { userId: session.userId },
      update: { points: { increment: Math.round(card.amount * 10) }, lifetime: { increment: Math.round(card.amount * 10) } },
      create: { userId: session.userId, points: Math.round(card.amount * 10), lifetime: Math.round(card.amount * 10) },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      amount: card.amount,
      message: `Gift card redeemed! $${card.amount} credit + ${Math.round(card.amount * 10)} loyalty points added to your account.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
