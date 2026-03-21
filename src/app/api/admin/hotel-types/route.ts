import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const types = await prisma.hotelType.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ types });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name, icon, sortOrder } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  try {
    const type = await prisma.hotelType.create({
      data: { name: name.trim(), icon: icon || 'hotel', sortOrder: sortOrder ?? 0 },
    });
    return NextResponse.json({ type });
  } catch {
    return NextResponse.json({ error: 'Hotel type already exists' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await req.json();
  await prisma.hotelType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, ...data } = await req.json();
  const type = await prisma.hotelType.update({ where: { id }, data });
  return NextResponse.json({ type });
}
