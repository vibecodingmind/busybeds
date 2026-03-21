export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  try {
    const card = await (prisma as any).giftCard.findUnique({
      where: { code: code.trim().toUpperCase() },
      select: { code: true, amount: true, balance: true, isActive: true, expiresAt: true, recipientName: true },
    });

    if (!card) return NextResponse.json({ valid: false, error: 'Invalid code' });

    const expired = card.expiresAt && new Date(card.expiresAt) < new Date();
    return NextResponse.json({
      valid: card.isActive && card.balance > 0 && !expired,
      amount: card.amount,
      balance: card.balance,
      expiresAt: card.expiresAt,
      recipientName: card.recipientName,
      error: !card.isActive ? 'Deactivated' : card.balance <= 0 ? 'No balance remaining' : expired ? 'Expired' : null,
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e.message });
  }
}
