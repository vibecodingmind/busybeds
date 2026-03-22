export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

function isAdmin(session: { role: string } | null) {
  return session?.role === 'admin';
}

// POST /api/admin/hotels/[id]/rooms — create room type
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name, description, pricePerNight, maxOccupancy, displayOrder } = await req.json();
  if (!name || !pricePerNight) return NextResponse.json({ error: 'name and pricePerNight required' }, { status: 400 });
  const room = await prisma.roomType.create({
    data: {
      hotelId: params.id,
      name,
      description: description || '',
      pricePerNight: Number(pricePerNight),
      maxOccupancy: Number(maxOccupancy) || 2,
      displayOrder: Number(displayOrder) || 0,
    },
  });
  return NextResponse.json({ room }, { status: 201 });
}

// PATCH /api/admin/hotels/[id]/rooms — update a room type
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { roomId, name, description, pricePerNight, maxOccupancy, displayOrder } = await req.json();
  if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  const existing = await prisma.roomType.findFirst({ where: { id: roomId, hotelId: params.id } });
  if (!existing) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  const room = await prisma.roomType.update({
    where: { id: roomId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(pricePerNight !== undefined && { pricePerNight: Number(pricePerNight) }),
      ...(maxOccupancy !== undefined && { maxOccupancy: Number(maxOccupancy) }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
    },
  });
  return NextResponse.json({ room });
}

// DELETE /api/admin/hotels/[id]/rooms — delete a room type
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { roomId } = await req.json();
  if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  const existing = await prisma.roomType.findFirst({ where: { id: roomId, hotelId: params.id } });
  if (!existing) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  await prisma.roomType.delete({ where: { id: roomId } });
  return NextResponse.json({ success: true });
}
