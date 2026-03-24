export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { uploadToCloudinary, deleteFromCloudinary, hasCloudinary } from '@/lib/cloudinary';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getHotelId(session.userId);
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const count = await prisma.hotelPhoto.count({ where: { hotelId } });
  if (count >= 10) return NextResponse.json({ error: 'Max 10 photos' }, { status: 400 });

  const contentType = req.headers.get('content-type') || '';

  let photoUrl: string;

  if (contentType.includes('multipart/form-data')) {
    // File upload path
    if (!hasCloudinary) {
      return NextResponse.json(
        { error: 'File upload not configured. Add Cloudinary environment variables or use a URL instead.' },
        { status: 503 }
      );
    }
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP and GIF allowed' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Max file size is 5 MB' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadToCloudinary(buffer, 'hotels');
    photoUrl = url;
  } else {
    // URL path (fallback)
    const body = await req.json();
    if (!body.url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    photoUrl = body.url.trim();
  }

  const photo = await prisma.hotelPhoto.create({
    data: { hotelId, url: photoUrl, displayOrder: count },
  });
  return NextResponse.json({ photo });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getHotelId(session.userId);
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const { photoId, isPrimary, displayOrder } = await req.json();
  const photo = await prisma.hotelPhoto.findFirst({ where: { id: photoId, hotelId } });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (isPrimary) {
    await prisma.hotelPhoto.updateMany({ where: { hotelId }, data: { isPrimary: false } });
  }

  const updated = await prisma.hotelPhoto.update({
    where: { id: photoId },
    data: {
      ...(isPrimary !== undefined ? { isPrimary } : {}),
      ...(displayOrder !== undefined ? { displayOrder } : {}),
    },
  });
  return NextResponse.json({ photo: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getHotelId(session.userId);
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const { photoId } = await req.json();
  const photo = await prisma.hotelPhoto.findFirst({ where: { id: photoId, hotelId } });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Try to delete from Cloudinary if URL is from Cloudinary
  if (photo.url.includes('cloudinary.com')) {
    try {
      const parts = photo.url.split('/');
      const fileWithExt = parts[parts.length - 1];
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
      await deleteFromCloudinary(publicId);
    } catch (e) {
      console.error('Cloudinary delete failed (continuing):', e);
    }
  }

  await prisma.hotelPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ ok: true });
}
