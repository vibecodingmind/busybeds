export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const managers = await prisma.hotelManager.findMany({
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      hotel: { select: { id: true, name: true, city: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  return NextResponse.json({ managers });
}

const assignSchema = z.object({
  userId: z.string().min(1),
  hotelId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, hotelId } = assignSchema.parse(body);

    // Verify user and hotel exist
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Upsert HotelManager record
    const manager = await prisma.hotelManager.upsert({
      where: { userId },
      update: { hotelId, assignedAt: new Date() },
      create: { userId, hotelId, assignedBy: session.userId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        hotel: { select: { id: true, name: true, city: true } },
      },
    });

    // Update user role to hotel_manager if not already
    if (user.role !== 'hotel_manager') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'hotel_manager' },
      });
    }

    return NextResponse.json({ manager }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get('managerId');

    if (!managerId) {
      return NextResponse.json({ error: 'managerId required' }, { status: 400 });
    }

    // Get manager to find userId
    const manager = await prisma.hotelManager.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Delete HotelManager record
    await prisma.hotelManager.delete({
      where: { id: managerId },
    });

    // Reset user role to 'traveler'
    await prisma.user.update({
      where: { id: manager.userId },
      data: { role: 'traveler' },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
