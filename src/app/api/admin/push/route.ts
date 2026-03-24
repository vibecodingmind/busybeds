export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import webpush from 'web-push';

function initWebPush() {
  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject    = process.env.VAPID_SUBJECT || 'mailto:support@busybeds.com';
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

// GET — return VAPID public key for frontend subscription
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}

// POST — send push notification to all subscribers (or specific userId)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!initWebPush()) {
    return NextResponse.json({ error: 'VAPID keys not configured. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT to your environment variables.' }, { status: 503 });
  }

  const body = await req.json();
  const { title, message, url, userId } = body as {
    title: string; message: string; url?: string; userId?: string;
  };

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  const where = userId ? { userId } : {};
  const subs = await prisma.pushSubscription.findMany({ where });

  const payload = JSON.stringify({ title, body: message, url: url || '/' });
  let sent = 0; let failed = 0;

  await Promise.allSettled(
    subs.map(async (row) => {
      try {
        const sub = JSON.parse(row.subscription);
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: any) {
        // Remove stale subscriptions (410 Gone = unsubscribed)
        if (err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: row.id } }).catch(() => {});
        }
        failed++;
      }
    })
  );

  return NextResponse.json({ ok: true, sent, failed, total: subs.length });
}
