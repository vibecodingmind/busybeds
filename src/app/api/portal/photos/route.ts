import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getHotelId(userId: string): Promise<string | null> {
  const owner = await prisma.hotelOwner.findUnique({ where: { userId } });
  if (owner) return owner.hotelId;
  const mgr = await prisma.hotelManager.findFirst({ where: { userId, isActive: true } });
  return mgr?.hotelId ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getHotelId(session.userId);
  if (!hotelId) return NextResponse.json({ photos: [] });
  const photos = await prisma.hotelPhoto.findMany({
    where: { hotelId },
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ photos });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getHotelId(session.userId);
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 404 });
  
  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 });
  
  // Max 10 photos
  const count = await prisma.hotelPhoto.count({ where: { hotelId } });
  if (count >= 10) return NextResponse.json({ error: 'Max 10 photos' }, { status: 400 });
  
  const photo = await prisma.hotelPhoto.create({
    data: { hotelId, url: url.trim(), displayOrder: count },
  });
  return NextResponse.json({ photo });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getHotelId(session.userId);
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 404 });
  
  const { photoId } = await req.json();
  // Verify this photo belongs to this hotel
  const photo = await prisma.hotelPhoto.findFirst({ where: { id: photoId, hotelId } });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.hotelPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ ok: true });
}
