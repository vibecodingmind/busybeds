/**
 * POST /api/price-alerts/send
 *
 * Processes price alerts — sends email notifications to subscribers
 * when a hotel's discount meets or exceeds their threshold.
 *
 * This endpoint is meant to be called by a cron job (e.g. daily at 8am).
 * Protected by CRON_SECRET environment variable.
 *
 * Usage:
 *   POST /api/price-alerts/send
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Also supports admin-triggered sends:
 *   POST /api/price-alerts/send
 *   Body: { hotelId: "xxx" }  — send only for specific hotel
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getSessionFromRequest } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

function emailDealAlert(
  recipientEmail: string,
  hotelName: string,
  hotelSlug: string,
  hotelCity: string,
  hotelCountry: string,
  discountPercent: number,
  coverImage: string | null,
  unsubUrl: string,
): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0}
    .wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
    .header{background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff}
    .body{padding:28px 32px;color:#1D2939;line-height:1.6}
    .hotel-img{width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:16px}
    .badge{display:inline-block;background:linear-gradient(135deg,#E8395A,#C0263D);color:white;font-size:28px;font-weight:900;padding:8px 20px;border-radius:12px;letter-spacing:-0.5px;margin-bottom:12px}
    .btn{display:inline-block;background:linear-gradient(135deg,#1A3C5E,#0E7C7B);color:white;padding:13px 30px;border-radius:10px;font-weight:bold;text-decoration:none;font-size:15px;margin-top:16px}
    .hotel-name{font-size:20px;font-weight:800;color:#1A3C5E;margin:0 0 4px}
    .hotel-loc{color:#6B7280;font-size:13px;margin:0 0 16px}
    .footer{padding:16px 32px;font-size:11px;color:#9CA3AF;border-top:1px solid #eee;text-align:center}
    .unsubscribe{color:#9CA3AF;font-size:11px}
  </style></head><body>
  <div class="wrap">
    <div class="header">
      <h2 style="margin:0;font-size:18px">🔔 Deal Alert — Price Drop!</h2>
      <p style="margin:4px 0 0;opacity:.75;font-size:13px">A hotel you're watching has a new deal</p>
    </div>
    <div class="body">
      ${coverImage ? `<img src="${coverImage}" class="hotel-img" alt="${hotelName}" />` : ''}
      <div class="badge">${discountPercent}% OFF</div>
      <p class="hotel-name">${hotelName}</p>
      <p class="hotel-loc">📍 ${hotelCity}, ${hotelCountry}</p>
      <p style="color:#374151;font-size:14px">
        Great news! <strong>${hotelName}</strong> is now offering <strong>${discountPercent}% off</strong> your stay.
        Generate your free coupon now before this deal changes.
      </p>
      <a href="${APP_URL}/hotels/${hotelSlug}" class="btn">🎫 Get My ${discountPercent}% Off Coupon</a>
      <p style="margin-top:20px;font-size:12px;color:#9CA3AF">
        This alert was sent because you subscribed to deal updates for ${hotelName}.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} BusyBeds ·
      <a href="${unsubUrl}" class="unsubscribe">Unsubscribe from this alert</a>
    </div>
  </div></body></html>`;
}

export async function POST(req: NextRequest) {
  // Auth: must be CRON_SECRET or admin user
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  let isAuthorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    isAuthorized = true;
  } else {
    const session = await getSessionFromRequest(req);
    if (session) {
      const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
      if (user?.role === 'admin') isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { hotelId?: string } = {};
  try { body = await req.json(); } catch { /* no body */ }

  const where = {
    isActive: true,
    ...(body.hotelId ? { hotelId: body.hotelId } : {}),
  };

  // Get all active alerts
  const alerts = await prisma.priceAlert.findMany({
    where,
    include: {
      hotel: {
        select: {
          id: true, name: true, slug: true, city: true, country: true,
          discountPercent: true, coverImage: true, status: true,
        },
      },
    },
  });

  let sent = 0;
  let skipped = 0;

  // Group by hotel to avoid spamming multiple alerts per hotel per run
  const hotelAlertMap = new Map<string, typeof alerts>();
  for (const alert of alerts) {
    if (!hotelAlertMap.has(alert.hotelId)) hotelAlertMap.set(alert.hotelId, []);
    hotelAlertMap.get(alert.hotelId)!.push(alert);
  }

  for (const [, hotelAlerts] of Array.from(hotelAlertMap)) {
    const hotel = hotelAlerts[0].hotel;
    if (!hotel || hotel.status !== 'active') { skipped += hotelAlerts.length; continue; }

    for (const alert of hotelAlerts) {
      // Skip if discount is below user's threshold
      if (hotel.discountPercent < alert.minDiscount) {
        skipped++;
        continue;
      }

      // Skip if already alerted in the last 24 hours for this alert
      if (alert.lastAlertAt) {
        const hoursSinceLastAlert = (Date.now() - alert.lastAlertAt.getTime()) / 3600000;
        if (hoursSinceLastAlert < 24) {
          skipped++;
          continue;
        }
      }

      const unsubUrl = `${APP_URL}/api/price-alerts/unsubscribe?id=${alert.id}&token=${Buffer.from(alert.email).toString('base64')}`;

      try {
        await sendEmail({
          to: alert.email,
          subject: `🔔 ${hotel.discountPercent}% OFF at ${hotel.name} — Deal Alert!`,
          html: emailDealAlert(
            alert.email,
            hotel.name,
            hotel.slug,
            hotel.city,
            hotel.country,
            hotel.discountPercent,
            hotel.coverImage,
            unsubUrl,
          ),
        });

        // Update lastAlertAt
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { lastAlertAt: new Date() },
        });

        sent++;
      } catch (e) {
        console.error(`[Price Alerts] Failed to send to ${alert.email}:`, e);
      }
    }
  }

  console.log(`[Price Alerts] Sent: ${sent}, Skipped: ${skipped}, Total: ${alerts.length}`);
  return NextResponse.json({ ok: true, sent, skipped, total: alerts.length });
}
