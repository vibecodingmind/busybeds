export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const schema = z.object({
  companyName: z.string().min(2).max(100),
  industry: z.string().max(80).optional(),
  country: z.string().min(1).max(80).default('Tanzania'),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(30).optional(),
  maxSeats: z.coerce.number().int().min(2).max(500).default(10),
  notes: z.string().max(500).optional(),
});

// GET — fetch caller's corporate account (if any)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Either they're the admin of a corporate account, or a member
  const corporate = await prisma.corporateAccount.findFirst({
    where: {
      OR: [
        { adminUserId: session.userId },
        { members: { some: { id: session.userId } } },
      ],
    },
    include: {
      adminUser: { select: { id: true, fullName: true, email: true } },
      members: { select: { id: true, fullName: true, email: true, createdAt: true } },
      subscriptions: {
        where: { status: 'active', expiresAt: { gt: new Date() } },
        include: { package: true },
        orderBy: { expiresAt: 'desc' },
        take: 1,
      },
    },
  });

  return NextResponse.json({ corporate });
}

// POST — create a new corporate account (caller becomes admin)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if already in or admin of a corporate account
  const existing = await prisma.corporateAccount.findFirst({
    where: {
      OR: [
        { adminUserId: session.userId },
        { members: { some: { id: session.userId } } },
      ],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'You already belong to a corporate account', code: 'ALREADY_EXISTS' },
      { status: 409 }
    );
  }

  const body = await req.json();
  const data = schema.parse(body);

  const corporate = await prisma.corporateAccount.create({
    data: {
      companyName: data.companyName,
      industry: data.industry,
      country: data.country,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      maxSeats: data.maxSeats,
      notes: data.notes,
      adminUserId: session.userId,
      status: 'pending',
    },
  });

  // Link the admin user to this corporate account as a member too
  await prisma.user.update({
    where: { id: session.userId },
    data: { corporateAccountId: corporate.id },
  });

  return NextResponse.json({ corporate }, { status: 201 });
}
