export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const schema = z.object({
  paypalEmail: z.string().email(),
});

const MIN_PAYOUT = 20;

// POST /api/referral/payout — request a cash payout
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Valid PayPal email required' }, { status: 400 });
  const { paypalEmail } = parsed.data;

  // Check for pending payout request
  const pending = await prisma.referralPayout.findFirst({
    where: { userId: session.userId, status: { in: ['requested', 'processing'] } },
  });
  if (pending) return NextResponse.json({ error: 'You already have a payout request in progress' }, { status: 409 });

  // Compute available balance (earnings where status=available)
  const now = new Date();
  await prisma.referralEarning.updateMany({
    where: { referrerId: session.userId, status: 'pending', availableAt: { lte: now } },
    data: { status: 'available' },
  });

  const availableEarnings = await prisma.referralEarning.findMany({
    where: { referrerId: session.userId, status: 'available' },
  });
  const available = availableEarnings.reduce((s, e) => s + e.amount, 0);

  if (available < MIN_PAYOUT) {
    return NextResponse.json({ error: `Minimum payout is $${MIN_PAYOUT}. Your available balance is $${available.toFixed(2)}.` }, { status: 400 });
  }

  // Create payout request and mark earnings as paid
  const payout = await prisma.referralPayout.create({
    data: { userId: session.userId, amount: available, paypalEmail, status: 'requested' },
  });

  await prisma.referralEarning.updateMany({
    where: { id: { in: availableEarnings.map(e => e.id) } },
    data: { status: 'paid' },
  });

  return NextResponse.json({ payout }, { status: 201 });
}
