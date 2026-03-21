import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const amenities = await prisma.amenity.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
  return NextResponse.json({ amenities });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name, icon, category, sortOrder } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  try {
    const amenity = await prisma.amenity.create({
      data: { name: name.trim(), icon: icon || '✓', category: category || 'General', sortOrder: sortOrder || 0 },
    });
    return NextResponse.json({ amenity });
  } catch {
    return NextResponse.json({ error: 'Amenity already exists' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await req.json();
  await prisma.amenity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, ...data } = await req.json();
  const amenity = await prisma.amenity.update({ where: { id }, data });
  return NextResponse.json({ amenity });
}
