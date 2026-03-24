export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return segments.join('-'); // e.g. BUSY-BEDS-GIFT-1234
}

// POST — purchase a gift card
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Please sign in to purchase a gift card' }, { status: 401 });

  try {
    const { amount, recipientEmail, recipientName, message } = await req.json();

    const validAmounts = [10, 25, 50, 100, 200];
    if (!validAmounts.includes(amount)) {
      return NextResponse.json({ error: 'Invalid gift card amount' }, { status: 400 });
    }

    const code = generateGiftCode();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const card = await (prisma as any).giftCard.create({
      data: {
        code,
        amount,
        balance: amount,
        purchasedById: session.userId,
        recipientEmail: recipientEmail || null,
        recipientName: recipientName || null,
        message: message || null,
        expiresAt,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET — my gift cards
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [purchased, redeemed] = await Promise.all([
      (prisma as any).giftCard.findMany({
        where: { purchasedById: session.userId },
        orderBy: { purchasedAt: 'desc' },
      }).catch(() => []),
      (prisma as any).giftCard.findMany({
        where: { redeemedById: session.userId },
        orderBy: { redeemedAt: 'desc' },
      }).catch(() => []),
    ]);

    return NextResponse.json({ purchased, redeemed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
