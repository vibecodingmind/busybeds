export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, content, recipientCount } = await req.json();
  const campaign = await prisma.emailCampaign.create({
    data: { title, content, recipientCount: recipientCount || 0 },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { sentAt: 'desc' },
  });

  return NextResponse.json({ campaigns });
}
