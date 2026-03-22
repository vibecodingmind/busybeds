export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Settings that must not be stored in DB (env-only, too sensitive)
const SKIP_KEYS = new Set(['stripeSecretKey', 'stripeWebhookSecret', 'smtpPass', 'googleClientSecret', 'cloudinaryApiSecret']);

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.siteSettings.findMany();
    const values: Record<string, string> = {};
    for (const row of rows) {
      if (!row.key.startsWith('currency_rates')) {
        values[row.key] = row.value;
      }
    }
    return NextResponse.json({ values });
  } catch {
    return NextResponse.json({ values: {} });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { values } = body as { values: Record<string, string> };

  if (!values || typeof values !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const ops = Object.entries(values)
      .filter(([k]) => !SKIP_KEYS.has(k) && !k.startsWith('currency_'))
      .map(([key, value]) =>
        prisma.siteSettings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      );
    await Promise.all(ops);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Settings save error:', e);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
