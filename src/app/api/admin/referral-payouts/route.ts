export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailPayoutProcessed } from '@/lib/email';

// GET /api/admin/referral-payouts — list all payout requests
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;

  const payouts = await prisma.referralPayout.findMany({
    where: status ? { status } : undefined,
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { requestedAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ payouts });
}

const patchSchema = z.object({
  status: z.enum(['processing', 'paid', 'rejected']),
  adminNotes: z.string().optional(),
});

// PATCH /api/admin/referral-payouts/[id] — update payout status
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const payout = await prisma.referralPayout.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
      processedAt: parsed.data.status === 'paid' || parsed.data.status === 'rejected' ? new Date() : undefined,
    },
    include: { user: true },
  });

  if (payout.status === 'paid' || payout.status === 'rejected') {
    try {
      await sendEmail({
        to: payout.user.email,
        subject: payout.status === 'paid' ? `Your $${payout.amount.toFixed(2)} payout has been sent — Busy Beds` : `Payout update — Busy Beds`,
        html: emailPayoutProcessed(payout.user.fullName, payout.amount, payout.status as 'paid' | 'rejected', payout.adminNotes ?? undefined),
      });
    } catch (e) { console.error('Email error:', e); }
  }

  return NextResponse.json({ payout });
}
