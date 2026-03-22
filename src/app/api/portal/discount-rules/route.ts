export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { parseRules, type DiscountRule } from '@/lib/discountRules';
import { randomBytes } from 'crypto';

async function resolveHotelId(session: { userId: string; role: string }, req: NextRequest): Promise<string | null> {
  if (session.role === 'hotel_owner') {
    const owner = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
    if (!owner || owner.kycStatus !== 'approved') return null;
    return owner.hotelId;
  }
  if (session.role === 'hotel_manager') {
    const mgr = await prisma.hotelManager.findFirst({ where: { userId: session.userId, isActive: true } });
    return mgr?.hotelId ?? null;
  }
  if (session.role === 'admin') {
    return new URL(req.url).searchParams.get('hotelId');
  }
  return null;
}

// GET — return current rules
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hotelId = await resolveHotelId(session as any, req);
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { discountPercent: true, discountRules: true } as any });
  if (!hotel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    baseDiscount: (hotel as any).discountPercent,
    rules: parseRules((hotel as any).discountRules || '[]'),
  });
}

const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  type: z.enum(['period', 'day_of_week', 'always']),
  discount: z.number().int().min(1).max(80),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.array(z.number().int().min(0).max(6)).optional(),
  isActive: z.boolean().default(true),
});

// PUT — replace all rules
export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hotelId = await resolveHotelId(session as any, req);
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const body = await req.json();
  const raw: DiscountRule[] = z.array(ruleSchema).parse(body.rules ?? []);
  const rules: DiscountRule[] = raw.map(r => ({
    ...r,
    id: r.id || randomBytes(6).toString('hex'),
  }));

  await prisma.hotel.update({ where: { id: hotelId }, data: { discountRules: JSON.stringify(rules) } as any });
  return NextResponse.json({ rules });
}
