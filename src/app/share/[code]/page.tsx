import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import SharePageClient from './SharePageClient';

export const dynamic = 'force-dynamic';

interface Props { params: { code: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: params.code },
    include: { hotel: true },
  });

  if (!coupon) return { title: 'Coupon Not Found – BusyBeds' };

  return {
    title: `${coupon.discountPercent}% OFF at ${coupon.hotel.name} – BusyBeds`,
    description: `Use this exclusive coupon for ${coupon.discountPercent}% off your stay at ${coupon.hotel.name} in ${coupon.hotel.city}. Valid until ${new Date(coupon.expiresAt).toLocaleDateString()}.`,
    openGraph: {
      title: `🎉 ${coupon.discountPercent}% Off at ${coupon.hotel.name}!`,
      description: `Someone shared this exclusive discount with you. Book your stay at ${coupon.hotel.name} and save ${coupon.discountPercent}%.`,
      images: [coupon.hotel.coverImage || '/og-default.jpg'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${coupon.discountPercent}% OFF – ${coupon.hotel.name}`,
      description: `Exclusive hotel discount shared via BusyBeds`,
    },
  };
}

export default async function SharePage({ params }: Props) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: params.code },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          country: true,
          starRating: true,
          category: true,
          descriptionShort: true,
          coverImage: true,
          discountPercent: true,
          avgRating: true,
          reviewCount: true,
        },
      },
      user: {
        select: { fullName: true },
      },
    },
  });

  if (!coupon) notFound();

  return (
    <SharePageClient
      coupon={{
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        status: coupon.status,
        expiresAt: coupon.expiresAt.toISOString(),
        guestName: coupon.guestName,
        qrDataUrl: coupon.qrDataUrl,
        sharedBy: coupon.user.fullName,
        hotel: coupon.hotel as any,
      }}
    />
  );
}
