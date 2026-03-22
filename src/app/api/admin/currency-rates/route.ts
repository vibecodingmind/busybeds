export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

const SETTING_KEY = 'currency_rates';

// Default fallback rates (used until admin sets custom ones)
const DEFAULT_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, TZS: 2600 };

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: SETTING_KEY } });
    const rates = row ? JSON.parse(row.value) : DEFAULT_RATES;
    return NextResponse.json({ rates });
  } catch {
    return NextResponse.json({ rates: DEFAULT_RATES });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { rates } = body as { rates: Record<string, number> };

  // Validate: must be numbers, USD must stay 1
  if (!rates || typeof rates !== 'object') {
    return NextResponse.json({ error: 'Invalid rates' }, { status: 400 });
  }
  const sanitised: Record<string, number> = { USD: 1 };
  for (const [code, val] of Object.entries(rates)) {
    if (code === 'USD') continue;
    const n = parseFloat(String(val));
    if (isNaN(n) || n <= 0) return NextResponse.json({ error: `Invalid rate for ${code}` }, { status: 400 });
    sanitised[code] = n;
  }

  await prisma.siteSettings.upsert({
    where:  { key: SETTING_KEY },
    update: { value: JSON.stringify(sanitised) },
    create: { key: SETTING_KEY, value: JSON.stringify(sanitised) },
  });

  return NextResponse.json({ ok: true, rates: sanitised });
}
