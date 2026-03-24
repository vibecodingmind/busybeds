export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getOwnerHotelId(session: { userId: string; role: string }) {
  if (session.role !== 'hotel_owner' && session.role !== 'admin') return null;
  if (session.role === 'hotel_owner') {
    const o = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
    return o?.kycStatus === 'approved' ? o.hotelId : null;
  }
  return null;
}

// GET — list managers for this hotel
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hotelId = await getOwnerHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const managers = await prisma.hotelManager.findMany({
    where: { hotelId },
    include: { user: { select: { id: true, fullName: true, email: true, avatar: true } } },
    orderBy: { assignedAt: 'desc' },
  });

  return NextResponse.json({ managers });
}

// POST — invite/add a manager by email
const addSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hotelId = await getOwnerHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email } = addSchema.parse(await req.json());

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'No user found with that email. They must create a BusyBeds account first.' }, { status: 404 });

  // Check if already a manager
  const existing = await prisma.hotelManager.findFirst({ where: { userId: user.id, hotelId } });
  if (existing) {
    if (existing.isActive) return NextResponse.json({ error: 'This person is already a manager.' }, { status: 409 });
    // Reactivate
    const updated = await prisma.hotelManager.update({ where: { id: existing.id }, data: { isActive: true } });
    return NextResponse.json({ manager: updated });
  }

  const manager = await prisma.hotelManager.create({
    data: { userId: user.id, hotelId, assignedBy: session.userId },
    include: { user: { select: { id: true, fullName: true, email: true, avatar: true } } },
  });
  return NextResponse.json({ manager }, { status: 201 });
}

// DELETE — remove a manager
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hotelId = await getOwnerHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { managerId } = await req.json();
  const manager = await prisma.hotelManager.findFirst({ where: { id: managerId, hotelId } });
  if (!manager) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.hotelManager.update({ where: { id: managerId }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
