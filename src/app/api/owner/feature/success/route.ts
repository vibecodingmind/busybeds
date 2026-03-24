export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// GET /api/owner/feature/success?days=X&hotelId=Y&session_id=Z
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days    = parseInt(searchParams.get('days') || '0');
  const hotelId = searchParams.get('hotelId') || '';
  const sid     = searchParams.get('session_id') || '';
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!days || !hotelId) return NextResponse.redirect(new URL('/owner', req.url));

  // Verify Stripe session paid (optional but recommended)
  if (stripe && sid) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sid);
      if (session.payment_status !== 'paid') return NextResponse.redirect(new URL('/owner?feature_failed=1', req.url));
    } catch (e) {
      console.error('[Feature Success]', e);
      return NextResponse.redirect(new URL('/owner?feature_failed=1', req.url));
    }
  }

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);

  await prisma.hotel.update({
    where: { id: hotelId },
    data: { isFeatured: true, featuredUntil },
  });

  return NextResponse.redirect(new URL('/owner?featured=1', appUrl));
}
