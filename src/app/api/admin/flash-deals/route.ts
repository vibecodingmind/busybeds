export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailFlashSaleAlert } from '@/lib/email';
import webpush from 'web-push';

async function requireAdmin(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return null;
  return session;
}

function initWebPush() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT || 'mailto:support@busybeds.com';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(sub, pub, priv);
  return true;
}

// GET  /api/admin/flash-deals  — list all deals
export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deals = await prisma.flashDeal.findMany({
    include: { hotel: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ deals });
}

// POST /api/admin/flash-deals  — create a flash deal + notify favorites
export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId, title, discountPercent, startsAt, endsAt, notify = true } = await req.json();
  if (!hotelId || !title || !discountPercent || !startsAt || !endsAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const deal = await prisma.flashDeal.create({
    data: {
      hotelId,
      title,
      discountPercent: Number(discountPercent),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      createdBy: session.userId,
    },
    include: { hotel: { select: { name: true, slug: true } } },
  });

  // Notify users who favorited this hotel (fire-and-forget)
  if (notify) {
    notifyFavorites(deal).catch(e => console.error('[FlashDeal notify error]', e));
  }

  return NextResponse.json({ deal });
}

async function notifyFavorites(deal: {
  hotel: { name: string; slug: string };
  discountPercent: number;
  endsAt: Date;
  hotelId: string;
}) {
  // Get users who favorited this hotel and have email/push
  const favorites = await prisma.favorite.findMany({
    where: { hotelId: deal.hotelId },
    include: {
      user: {
        select: { fullName: true, email: true, pushSubscription: true },
      },
    },
    take: 500,
  });

  const hasPush = initWebPush();

  await Promise.allSettled(
    favorites.map(async (fav) => {
      const { user } = fav;

      // Email notification
      sendEmail({
        to: user.email,
        subject: `⚡ Flash Deal: ${deal.discountPercent}% OFF at ${deal.hotel.name}!`,
        html: emailFlashSaleAlert(user.fullName, deal.hotel.name, deal.discountPercent, deal.endsAt, deal.hotel.slug),
      }).catch(() => {});

      // Push notification
      if (hasPush && user.pushSubscription) {
        const payload = JSON.stringify({
          title: `⚡ Flash Deal: ${deal.discountPercent}% OFF!`,
          body: `Limited time at ${deal.hotel.name}. Get your coupon now!`,
          url: `/hotels/${deal.hotel.slug}`,
        });
        webpush.sendNotification(JSON.parse(user.pushSubscription.subscription), payload)
          .catch(async (err: any) => {
            if (err?.statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: user.pushSubscription!.id } }).catch(() => {});
            }
          });
      }
    })
  );
}

// DELETE /api/admin/flash-deals?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.flashDeal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/flash-deals?id=xxx  — toggle active / update
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await req.json();
  const deal = await prisma.flashDeal.update({ where: { id }, data: body });
  return NextResponse.json({ deal });
}
