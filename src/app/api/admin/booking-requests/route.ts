export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return null;
  return session;
}

// GET /api/admin/booking-requests
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page') || 1);
  const limit = 20;

  const where: any = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.bookingRequest.findMany({
      where,
      include: {
        hotel: { select: { name: true, slug: true, city: true } },
        user:  { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bookingRequest.count({ where }),
  ]);

  return NextResponse.json({ requests, total, pages: Math.ceil(total / limit) });
}

// PATCH /api/admin/booking-requests?id=xxx  — update status / hotel notes
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await req.json();
  const allowed = ['status', 'hotelNotes'];
  const data: any = {};
  for (const key of allowed) { if (key in body) data[key] = body[key]; }

  const updated = await prisma.bookingRequest.update({ where: { id }, data });
  return NextResponse.json({ request: updated });
}
