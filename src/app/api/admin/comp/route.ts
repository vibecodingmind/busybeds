export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const compSchema = z.object({
  userId: z.string().min(1),
  packageId: z.string().min(1),
  reason: z.string().min(1),
  days: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, packageId, reason, days } = compSchema.parse(body);

    // Verify user and package exist
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Cancel any existing active subscription
    await prisma.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled' },
    });

    // Calculate expiry date
    const now = new Date();
    const durationDays = days ?? pkg.durationDays;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Create new comped subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        packageId,
        status: 'active',
        startsAt: now,
        expiresAt,
        compedBy: session.userId,
        compedReason: reason,
      },
      include: { package: true },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
