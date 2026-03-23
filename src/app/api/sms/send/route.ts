export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, phone, message } = await req.json();

  const smsLog = await prisma.sMSLog.create({
    data: { userId: userId || null, phone, message, status: 'pending' },
  });

  return NextResponse.json({ smsLog }, { status: 201 });
}
