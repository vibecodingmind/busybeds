export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, TZS: 2600 };

export async function GET() {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: 'currency_rates' } });
    const rates = row ? JSON.parse(row.value) : DEFAULT_RATES;
    return NextResponse.json({ rates }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json({ rates: DEFAULT_RATES });
  }
}
