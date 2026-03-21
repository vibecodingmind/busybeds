export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { hasPayPal, createPayPalProduct, createPayPalPlan } from '@/lib/paypal';

/**
 * POST /api/admin/packages/backfill-paypal
 * Creates PayPal products + plans for any subscription packages that are missing a paypalPlanId.
 * Safe to call multiple times — skips packages that already have a valid paypalPlanId.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!hasPayPal) {
    return NextResponse.json(
      { error: 'PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to your Vercel environment variables.' },
      { status: 503 }
    );
  }

  // Find all packages — then filter client-side to handle null OR empty string
  const allPackages = await prisma.subscriptionPackage.findMany();

  // Filter: missing paypalPlanId means null, undefined, or empty string
  const packages = allPackages.filter(
    (p: any) => !p.paypalPlanId || String(p.paypalPlanId).trim() === ''
  );

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

      if (!product?.id) {
        throw new Error(`PayPal product creation returned no ID. Response: ${JSON.stringify(product)}`);
      }

      const plan = await createPayPalPlan(
        product.id,
        `BusyBeds ${pkg.name}`,
        Number(pkg.priceMonthly)
      );

      if (!plan?.id) {
        throw new Error(`PayPal plan creation returned no ID. Response: ${JSON.stringify(plan)}`);
      }

      await (prisma.subscriptionPackage as any).update({
        where: { id: pkg.id },
        data: { paypalPlanId: plan.id },
      });

      results.push({ id: pkg.id, name: pkg.name, paypalPlanId: plan.id });
    } catch (err: any) {
      console.error(`[PayPal Backfill] Failed for package ${pkg.id} (${pkg.name}):`, err);
      results.push({
        id: pkg.id,
        name: pkg.name,
        paypalPlanId: null,
        error: err?.message || 'Unknown error',
      });
    }
  }

  const successCount = results.filter(r => !r.error).length;
  const failCount = results.filter(r => r.error).length;

  return NextResponse.json({
    message: failCount === 0
      ? `Done! ${successCount} package${successCount !== 1 ? 's' : ''} now have PayPal plans.`
      : `${successCount} succeeded, ${failCount} failed. Check results for details.`,
    updated: successCount,
    results,
  });
}

/**
 * GET /api/admin/packages/backfill-paypal
 * Returns a status overview — how many packages have/missing PayPal plans.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const allPackages = await prisma.subscriptionPackage.findMany();
  const missing = allPackages.filter((p: any) => !p.paypalPlanId || String(p.paypalPlanId).trim() === '');
  const linked = allPackages.filter((p: any) => p.paypalPlanId && String(p.paypalPlanId).trim() !== '');

  return NextResponse.json({
    total: allPackages.length,
    linked: linked.length,
    missing: missing.length,
    paypalConfigured: hasPayPal,
    packages: allPackages.map((p: any) => ({
      id: p.id,
      name: p.name,
      priceMonthly: p.priceMonthly,
      paypalPlanId: p.paypalPlanId || null,
      stripePriceIdMonthly: p.stripePriceIdMonthly || null,
    })),
  });
}
