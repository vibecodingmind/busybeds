export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailKycApproved, emailKycRejected } from '@/lib/email';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const applications = await prisma.hotelOwner.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      hotel: { select: { name: true, city: true, country: true } },
    },
    orderBy: { kycSubmittedAt: 'desc' },
  });
  return NextResponse.json({ applications });
}

const schema = z.object({
  applicationId: z.string(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { applicationId, action, reason } = schema.parse(body);

  const application = await prisma.hotelOwner.update({
    where: { id: applicationId },
    data: {
      kycStatus: action === 'approve' ? 'approved' : 'rejected',
      kycReviewedAt: new Date(),
      ...(reason ? { kycRejectionReason: reason } : {}),
    },
    include: {
      user: { select: { fullName: true, email: true } },
      hotel: { select: { name: true } },
    },
  });

  // Notify the owner
  try {
    if (action === 'approve') {
      await sendEmail({
        to: application.user.email,
        subject: 'Your hotel application was approved — Busy Beds',
        html: emailKycApproved(application.user.fullName, application.hotel.name),
      });
    } else {
      await sendEmail({
        to: application.user.email,
        subject: 'Update on your hotel application — Busy Beds',
        html: emailKycRejected(application.user.fullName, application.hotel.name, reason),
      });
    }
  } catch (e) { console.error('Email error:', e); }

  return NextResponse.json({ application });
}
