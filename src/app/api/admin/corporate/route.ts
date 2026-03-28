export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// GET — list all corporate accounts with member + subscription stats
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || undefined;

  const accounts = await prisma.corporateAccount.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      adminUser: { select: { id: true, fullName: true, email: true } },
      members: { select: { id: true, fullName: true, email: true } },
      subscriptions: {
        where: { status: 'active', expiresAt: { gt: new Date() } },
        include: { package: true },
        take: 1,
        orderBy: { expiresAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: accounts.length,
    active: accounts.filter(a => a.status === 'active').length,
    pending: accounts.filter(a => a.status === 'pending').length,
    suspended: accounts.filter(a => a.status === 'suspended').length,
    totalSeats: accounts.reduce((s, a) => s + a.maxSeats, 0),
    totalMembers: accounts.reduce((s, a) => s + a.members.length, 0),
  };

  return NextResponse.json({ accounts, stats });
}

// PATCH — update corporate account (approve/suspend/update seats)
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, maxSeats, notes } = z.object({
    id: z.string(),
    status: z.enum(['pending', 'active', 'suspended']).optional(),
    maxSeats: z.coerce.number().int().min(2).max(500).optional(),
    notes: z.string().optional(),
  }).parse(body);

  const account = await prisma.corporateAccount.findUnique({
    where: { id },
    include: { adminUser: { select: { email: true, fullName: true } } },
  });
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.corporateAccount.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(maxSeats !== undefined && { maxSeats }),
      ...(notes !== undefined && { notes }),
    },
  });

  // If activating for first time, send approval email
  if (status === 'active' && account.status === 'pending') {
    sendEmail({
      to: account.adminUser.email,
      subject: `Your BusyBeds Corporate Account is Approved! 🎉`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#1A3C5E;">Corporate Account Approved! 🎉</h2>
          <p>Hi ${account.adminUser.fullName},</p>
          <p>Great news — your corporate account for <strong>${account.companyName}</strong> has been approved on BusyBeds.</p>
          <p>Your account comes with up to <strong>${updated.maxSeats} seats</strong>. You can now:</p>
          <ul>
            <li>Subscribe to a plan that covers all your team members</li>
            <li>Invite colleagues to join your corporate account</li>
            <li>Track usage across your entire team</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/corporate" style="background:#ea4d60;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin-top:8px;">Manage Your Account</a></p>
          <p style="color:#888;font-size:12px;margin-top:24px;">— The BusyBeds Team</p>
        </div>
      `,
    }).catch(e => console.error('[Corporate approve] Email error:', e));
  }

  if (status === 'suspended' && account.status === 'active') {
    sendEmail({
      to: account.adminUser.email,
      subject: `BusyBeds Corporate Account Suspended`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#1A3C5E;">Account Suspended</h2>
          <p>Hi ${account.adminUser.fullName},</p>
          <p>Your corporate BusyBeds account for <strong>${account.companyName}</strong> has been suspended. Please contact support to resolve this.</p>
          <p style="color:#888;font-size:12px;">— The BusyBeds Team</p>
        </div>
      `,
    }).catch(e => console.error('[Corporate suspend] Email error:', e));
  }

  return NextResponse.json({ account: updated });
}
