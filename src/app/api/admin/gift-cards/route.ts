export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/admin/gift-cards — list all gift cards with filters
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // 'active' | 'redeemed' | 'expired' | 'all'
  const search = searchParams.get('search') || '';

  const now = new Date();
  let where: Record<string, unknown> = {};

  if (status === 'redeemed') {
    where.redeemedById = { not: null };
  } else if (status === 'expired') {
    where.isActive = true;
    where.redeemedById = null;
    where.expiresAt = { lt: now };
  } else if (status === 'active') {
    where.isActive = true;
    where.redeemedById = null;
    where.expiresAt = { gte: now };
  }

  const cards = await (prisma as any).giftCard.findMany({
    where,
    include: {
      purchasedBy: { select: { id: true, fullName: true, email: true } },
      redeemedBy:  { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { purchasedAt: 'desc' },
    take: 200,
  });

  // Filter by search (code, purchaser name/email)
  const filtered = search
    ? cards.filter((c: any) =>
        c.code.includes(search.toUpperCase()) ||
        c.purchasedBy?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.purchasedBy?.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.recipientEmail?.toLowerCase().includes(search.toLowerCase())
      )
    : cards;

  // Stats
  const stats = {
    total:    cards.length,
    active:   cards.filter((c: any) => c.isActive && !c.redeemedById && c.expiresAt >= now).length,
    redeemed: cards.filter((c: any) => c.redeemedById).length,
    expired:  cards.filter((c: any) => c.isActive && !c.redeemedById && c.expiresAt < now).length,
    totalValue:    cards.reduce((s: number, c: any) => s + c.amount, 0),
    redeemedValue: cards.filter((c: any) => c.redeemedById).reduce((s: number, c: any) => s + c.amount, 0),
  };

  return NextResponse.json({ cards: filtered, stats });
}

// PATCH /api/admin/gift-cards — deactivate a gift card
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const card = await (prisma as any).giftCard.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json({ card });
}
