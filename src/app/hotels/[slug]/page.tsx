import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import HotelPageClient from './HotelPageClient';
import { getEffectiveDiscount } from '@/lib/discountRules';

interface PageProps { params: { slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: params.slug },
    include: { roomTypes: { take: 1 }, photos: { take: 1 } },
  });

  if (!hotel) return { title: 'Hotel Not Found — BusyBeds' };

  const { discount: metaDiscount } = getEffectiveDiscount((hotel as any).discountRules || '[]', hotel.discountPercent);
  const base = hotel.roomTypes[0]?.pricePerNight ?? null;
  const discounted = base ? Math.round(base * (1 - metaDiscount / 100)) : null;
  const image = hotel.coverImage || hotel.photos[0]?.url || 'https://busybeds.com/og-default.jpg';
  const desc = `Save ${metaDiscount}% at ${hotel.name} in ${hotel.city}, ${hotel.country}.${discounted ? ` From $${discounted}/night.` : ''} Get your exclusive discount coupon now on BusyBeds.`;

  return {
    title: `${hotel.name} — ${metaDiscount}% Off | BusyBeds`,
    description: desc,
    openGraph: {
      title: `${hotel.name} — ${hotel.discountPercent}% Discount`,
      description: desc,
      images: [{ url: image, width: 1200, height: 630, alt: hotel.name }],
      type: 'website',
      siteName: 'BusyBeds',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${hotel.name} — ${hotel.discountPercent}% Off`,
      description: desc,
      images: [image],
    },
    keywords: [hotel.name, hotel.city, hotel.country, 'hotel discount', 'hotel coupon', 'BusyBeds', `${hotel.discountPercent}% off hotel`],
  };
}

export default async function HotelPage({ params }: PageProps) {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: params.slug },
    include: {
      roomTypes: true,
      photos: true,
      affiliateLinks: true,
    },
  });

  if (!hotel) notFound();

  // Serialise to a plain object (dates → strings, decimals → numbers)
  const hotelData = {
    id: hotel.id,
    name: hotel.name,
    city: hotel.city,
    country: hotel.country,
    address: (hotel as any).address ?? null,
    category: (hotel as any).category ?? null,
    slug: hotel.slug,
    descriptionShort: hotel.descriptionShort,
    descriptionLong: hotel.descriptionLong,
    starRating: hotel.starRating,
    amenities: (() => {
      try { return JSON.parse(hotel.amenities as unknown as string); } catch { return []; }
    })(),
    vibeTags: (() => {
      try { return JSON.parse((hotel as any).vibeTags || '[]'); } catch { return []; }
    })(),
    websiteUrl: (hotel as any).websiteUrl ?? null,
    whatsapp: (hotel as any).whatsapp ?? null,
    email: (hotel as any).email ?? null,
    coverImage: hotel.coverImage ?? null,
    discountPercent: (() => { const { discount } = getEffectiveDiscount((hotel as any).discountRules || '[]', hotel.discountPercent); return discount; })(),
    couponValidDays: hotel.couponValidDays,
    avgRating: (hotel as any).avgRating ?? null,
    reviewCount: (hotel as any).reviewCount ?? 0,
    isFeatured: hotel.isFeatured,
    roomTypes: hotel.roomTypes.map(r => ({
      id: r.id,
      name: r.name,
      description: (r as any).description ?? '',
      pricePerNight: r.pricePerNight,
      maxOccupancy: (r as any).maxOccupancy ?? 1,
    })),
    photos: hotel.photos.map(p => ({ id: p.id, url: p.url })),
    affiliateLinks: hotel.affiliateLinks.map(l => ({ id: l.id, platform: l.platform, url: l.url })),
  };

  return <HotelPageClient hotel={hotelData} />;
}
