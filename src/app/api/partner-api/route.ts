export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { partnerId, name, rateLimit } = await req.json();
  const keyPrefix = 'pk_live_' + crypto.randomBytes(16).toString('hex');
  const keyHash = crypto.createHash('sha256').update(keyPrefix).digest('hex');

  const apiKey = await prisma.partnerAPIKey.create({
    data: { partnerId, keyPrefix, keyHash, name, rateLimit: rateLimit || 1000 },
  });

  return NextResponse.json({ apiKey: { ...apiKey, fullKey: keyPrefix } }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const apiKeys = await prisma.partnerAPIKey.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ apiKeys });
}
