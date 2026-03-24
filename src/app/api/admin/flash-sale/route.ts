export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailFlashSaleAlert } from '@/lib/email';

const schema = z.object({
  hotelId:     z.string(),
  discount:    z.number().int().min(1).max(100),
  endsAt:      z.string(), // ISO date string
  emailSubs:   z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = schema.parse(await req.json());
  const endsAt = new Date(body.endsAt);

  const hotel = await prisma.hotel.findUnique({ where: { id: body.hotelId } });
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  // Get all users with active subscriptions
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'active', expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    distinct: ['userId'],
  });

  const sent: string[]   = [];
  const failed: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

  for (const sub of activeSubs) {
    try {
      await sendEmail({
        to: sub.user.email,
        subject: `🔥 Flash Sale: ${body.discount}% OFF at ${hotel.name} — Limited time!`,
        html: emailFlashSaleAlert(
          sub.user.fullName,
          hotel.name,
          body.discount,
          endsAt,
          hotel.slug,
        ),
      });
      sent.push(sub.user.email);
    } catch (e) {
      console.error(`Flash sale email failed for ${sub.user.email}:`, e);
      failed.push(sub.user.email);
    }
  }

  return NextResponse.json({
    sent: sent.length,
    failed: failed.length,
    hotel: hotel.name,
    message: `Flash sale alert sent to ${sent.length} subscribers${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
  });
}
