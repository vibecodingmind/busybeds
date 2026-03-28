export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailCouponExpiringSoon } from '@/lib/email';

// Shared auth check for cron or admin
async function authCheck(req: NextRequest): Promise<boolean> {
  const session = await getSessionFromRequest(req);
  if (session?.role === 'admin') return true;
  // X-Cron-Secret (manual trigger) or Authorization: Bearer <secret> (Vercel Cron)
  const cronHeader = req.headers.get('X-Cron-Secret');
  const authHeader = req.headers.get('Authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (cronHeader === secret) return true;
  if (authHeader === `Bearer ${secret}`) return true;
  return false;
}

// GET — called by Vercel Cron (sends GET with Authorization: Bearer <CRON_SECRET>)
export async function GET(req: NextRequest) {
  if (!await authCheck(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return runReminders();
}

// POST — called manually by admin or scripts
export async function POST(req: NextRequest) {
  if (!await authCheck(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return runReminders();
}

async function runReminders(): Promise<NextResponse> {

  try {
    const now = new Date();
    // Window: expiring between 2 and 3 days from now
    // Narrow window prevents duplicates when triggered once daily
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const coupons = await prisma.coupon.findMany({
      where: {
        status: 'active',
        expiresAt: { gte: in2Days, lte: in3Days },
      },
      include: {
        user:  { select: { id: true, fullName: true, email: true } },
        hotel: { select: { name: true, slug: true } },
      },
    });

    const sent: string[]   = [];
    const failed: string[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

    for (const coupon of coupons) {
      try {
        const shareUrl = `${appUrl}/share/${coupon.code}`;
        await sendEmail({
          to: coupon.user.email,
          subject: `⏰ Your ${coupon.discountPercent}% coupon for ${coupon.hotel.name} expires in 2 days!`,
          html: emailCouponExpiringSoon(
            coupon.user.fullName,
            coupon.hotel.name,
            coupon.code,
            coupon.discountPercent,
            coupon.expiresAt,
            shareUrl,
          ),
        });
        sent.push(coupon.id);
      } catch (e) {
        console.error(`Coupon expiry reminder failed for ${coupon.id}:`, e);
        failed.push(coupon.id);
      }
    }

    return NextResponse.json({
      sent: sent.length,
      failed: failed.length,
      total: coupons.length,
      message: `Sent ${sent.length} coupon expiry reminders${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
    });
  } catch (error) {
    console.error('Coupon expiry reminders error:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
