export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendSMS, smsBroadcast } from '@/lib/sms';

// GET — SMS logs + stats
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = 50;
  const statusFilter = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const [logs, total, stats] = await Promise.all([
    prisma.sMSLog.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { OR: [{ phone: { contains: search } }, { message: { contains: search } }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.sMSLog.count({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { OR: [{ phone: { contains: search } }, { message: { contains: search } }] } : {}),
      },
    }),
    prisma.sMSLog.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const statMap = Object.fromEntries(stats.map(s => [s.status, s._count.id]));

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / pageSize),
    stats: {
      total: Object.values(statMap).reduce((a, b) => a + b, 0),
      sent: statMap['sent'] || 0,
      pending: statMap['pending'] || 0,
      failed: statMap['failed'] || 0,
    },
  });
}

// POST — admin broadcast SMS to multiple users or a single number
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { target, phones, message, senderId } = z.object({
    target: z.enum(['single', 'all_users', 'users_with_phone', 'custom']),
    phones: z.array(z.string()).optional(),   // for single or custom
    message: z.string().min(1).max(320),
    senderId: z.string().max(11).optional(),
  }).parse(body);

  let recipients: { phone: string; userId?: string }[] = [];

  if (target === 'single' || target === 'custom') {
    recipients = (phones || []).map(p => ({ phone: p.trim() }));
  } else {
    // Fetch users with phone numbers
    const users = await prisma.user.findMany({
      where: { phone: { not: null }, isBanned: false },
      select: { id: true, phone: true, notificationPreference: { select: { smsAlerts: true } } },
    });

    if (target === 'all_users') {
      recipients = users.map(u => ({ phone: u.phone!, userId: u.id }));
    } else {
      // users_with_phone: only those who opted in (or haven't set preference)
      recipients = users
        .filter(u => u.notificationPreference?.smsAlerts !== false)
        .map(u => ({ phone: u.phone!, userId: u.id }));
    }
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
  }

  const smsMessage = smsBroadcast(message);

  // Send in batches to avoid overwhelming the API
  let sent = 0;
  let failed = 0;

  // SDASMS supports comma-separated numbers for bulk, but we chunk to avoid
  // very large payloads and get per-user logging
  const BATCH_SIZE = 50;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const phones = batch.map(r => r.phone);
    // Use first userId in batch (multi-send has one log per batch)
    const result = await sendSMS({
      to: phones,
      message: smsMessage,
      senderId,
      userId: batch[0].userId,
    });
    if (result.success) sent += batch.length;
    else failed += batch.length;
  }

  return NextResponse.json({
    sent,
    failed,
    total: recipients.length,
    message: `Broadcast sent to ${sent}/${recipients.length} recipients`,
  });
}
