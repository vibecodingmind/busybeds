import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET() {
  const packages = await prisma.subscriptionPackage.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
  });
  return NextResponse.json({ packages });
}

const createSchema = z.object({
  name: z.string().min(2),
  priceMonthly: z.number().positive(),
  priceAnnual: z.number().positive().optional(),
  durationDays: z.number().int().positive(),
  couponLimitPerPeriod: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const data = createSchema.parse(body);
  const pkg = await prisma.subscriptionPackage.create({ data });
  return NextResponse.json({ package: pkg }, { status: 201 });
}
