export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { hasPayPal, createPayPalProduct, createPayPalPlan } from '@/lib/paypal';

/**
 * POST /api/admin/packages/backfill-paypal
 * Creates PayPal products + plans for any subscription packages that are missing a paypalPlanId.
 * Safe to call multiple times — skips packages that already have a paypalPlanId.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!hasPayPal) {
    return NextResponse.json(
      { error: 'PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to your environment.' },
      { status: 503 }
    );
  }

  // Find all packages without a PayPal plan ID
  const packages = await prisma.subscriptionPackage.findMany({
    where: { paypalPlanId: null } as any,
  });

  if (packages.length === 0) {
    return NextResponse.json({ message: 'All packages already have PayPal plans.', updated: 0 });
  }

  const results: { id: string; name: string; paypalPlanId: string | null; error?: string }[] = [];

  for (const pkg of packages) {
    try {
      const product = await createPayPalProduct(
        `BusyBeds ${pkg.name}`,
        `BusyBeds ${pkg.name} — ${pkg.couponLimitPerPeriod} coupons per period`
      );
      const plan = await createPayPalPlan(
        product.id,
        `BusyBeds ${pkg.name}`,
        Number(pkg.priceMonthly)
      );

      await prisma.subscriptionPackage.update({
        where: { id: pkg.id },
        data: { paypalPlanId: plan.id } as any,
      });

      results.push({ id: pkg.id, name: pkg.name, paypalPlanId: plan.id });
    } catch (err: any) {
      console.error(`[PayPal Backfill] Failed for package ${pkg.id}:`, err);
      results.push({ id: pkg.id, name: pkg.name, paypalPlanId: null, error: err?.message || 'Unknown error' });
    }
  }

  const successCount = results.filter(r => !r.error).length;
  return NextResponse.json({
    message: `Backfill complete. ${successCount}/${packages.length} packages updated.`,
    updated: successCount,
    results,
  });
}
