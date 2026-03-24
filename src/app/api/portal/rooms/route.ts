export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getStaffHotelId(session: { userId: string; role: string }) {
  if (session.role === 'hotel_owner') {
    const o = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
    return o?.kycStatus === 'approved' ? o.hotelId : null;
  }
  if (session.role === 'hotel_manager') {
    const m = await prisma.hotelManager.findFirst({ where: { userId: session.userId, isActive: true } });
    return m?.hotelId ?? null;
  }
  return null;
}

const roomSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  pricePerNight: z.number().positive(),
  maxOccupancy: z.number().int().min(1).default(2),
  displayOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getStaffHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data = roomSchema.parse(body);
  const room = await prisma.roomType.create({ data: { ...data, hotelId } });
  return NextResponse.json({ room }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getStaffHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { roomId, ...updates } = await req.json();
  const room = await prisma.roomType.findFirst({ where: { id: roomId, hotelId } });
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patchSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    pricePerNight: z.number().positive().optional(),
    maxOccupancy: z.number().int().min(1).optional(),
    displayOrder: z.number().int().optional(),
  });
  const data = patchSchema.parse(updates);
  const updated = await prisma.roomType.update({ where: { id: roomId }, data });
  return NextResponse.json({ room: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getStaffHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { roomId } = await req.json();
  const room = await prisma.roomType.findFirst({ where: { id: roomId, hotelId } });
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.roomType.delete({ where: { id: roomId } });
  return NextResponse.json({ ok: true });
}
