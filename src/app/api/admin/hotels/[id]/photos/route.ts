export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

function isAdmin(session: { role: string } | null) {
  return session?.role === 'admin';
}

// POST /api/admin/hotels/[id]/photos — add a photo URL
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { url, displayOrder } = await req.json();
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  const photo = await prisma.hotelPhoto.create({
    data: { hotelId: params.id, url, displayOrder: Number(displayOrder) || 0 },
  });
  return NextResponse.json({ photo }, { status: 201 });
}

// DELETE /api/admin/hotels/[id]/photos — delete a photo
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { photoId } = await req.json();
  if (!photoId) return NextResponse.json({ error: 'photoId required' }, { status: 400 });
  const existing = await prisma.hotelPhoto.findFirst({ where: { id: photoId, hotelId: params.id } });
  if (!existing) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  await prisma.hotelPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ success: true });
}

// PUT /api/admin/hotels/[id]/photos — replace all photo URLs at once
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { urls } = await req.json(); // string[]
  if (!Array.isArray(urls)) return NextResponse.json({ error: 'urls array required' }, { status: 400 });
  // Delete existing, then recreate
  await prisma.hotelPhoto.deleteMany({ where: { hotelId: params.id } });
  const photos = await prisma.$queryRawUnsafe(
    `SELECT 1` // no-op; we use createMany below
  ).catch(() => null);
  void photos;
  if (urls.length > 0) {
    await prisma.hotelPhoto.createMany({
      data: urls.filter(Boolean).map((url: string, i: number) => ({
        hotelId: params.id,
        url,
        displayOrder: i,
      })),
    });
  }
  const result = await prisma.hotelPhoto.findMany({ where: { hotelId: params.id }, orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ photos: result });
}
