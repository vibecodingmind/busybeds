export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * POST /api/hotels/affiliate-click
 * Records a click on an affiliate link.
 * Body: { linkId: string }
 *
 * Requires the user to be authenticated (has an active subscription to see links).
 * Increments clickCount and records lastClickedAt.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const linkId = body?.linkId as string | undefined;

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    // Verify link exists and belongs to an active hotel
    const link = await prisma.affiliateLink.findUnique({
      where: { id: linkId },
      include: { hotel: { select: { status: true } } },
    });

    if (!link) {
      return NextResponse.json({ error: 'Affiliate link not found' }, { status: 404 });
    }

    if (link.hotel.status !== 'active') {
      return NextResponse.json({ error: 'Hotel is not active' }, { status: 400 });
    }

    // Increment click count using raw SQL (safe against pre-generate Prisma client)
    await prisma.$executeRaw`
      UPDATE "AffiliateLink"
      SET "clickCount" = "clickCount" + 1,
          "lastClickedAt" = ${new Date()},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${linkId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Affiliate click error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
