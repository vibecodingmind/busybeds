export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.userId },
  });

  return NextResponse.json({
    preferences: prefs || {
      emailNewDeals: true,
      emailWeeklyDigest: true,
      emailRedemptionReminder: true,
      pushNotifications: true,
      smsAlerts: false,
      language: 'en',
      timezone: 'UTC',
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, ...body },
    update: body,
  });

  return NextResponse.json({ preferences: prefs });
}
