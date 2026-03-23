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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const redeemedThisMonth = await prisma.coupon.count({
    where: { hotelId: hotel.id, status: 'redeemed', redeemedAt: { gte: startOfMonth } },
  });

  if (!hotel) notFound();

  // Fetch related hotels — prefer vibe tag matches across all cities, fall back to same city
  const currentVibeTags: string[] = (() => {
    try { return JSON.parse((hotel as any).vibeTags || '[]'); } catch { return []; }
  })();

  type RelatedHotelRaw = Awaited<ReturnType<typeof prisma.hotel.findMany<{
    include: { roomTypes: true; photos: true };
  }>>>[number];

  let relatedRaw: RelatedHotelRaw[] = [];

  if (currentVibeTags.length > 0) {
    const vibeMatches = await prisma.hotel.findMany({
      where: {
        status: 'active',
        slug: { not: params.slug },
        OR: currentVibeTags.map(tag => ({
          vibeTags: { contains: `"${tag}"`, mode: 'insensitive' as const },
        })),
      },
      include: {
        roomTypes: { orderBy: { displayOrder: 'asc' }, take: 1 },
        photos:    { orderBy: { displayOrder: 'asc' }, take: 1 },
      },
      orderBy: [{ isFeatured: 'desc' }, { avgRating: 'desc' }],
      take: 20,
    }).catch(() => []);

    // Score by number of matching vibe tags, take top 4
    const scored = vibeMatches
      .map(h => {
        const hTags: string[] = (() => { try { return JSON.parse((h as any).vibeTags || '[]'); } catch { return []; } })();
        const matchCount = hTags.filter((t: string) => currentVibeTags.includes(t)).length;
        return { hotel: h, matchCount };
      })
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 4)
      .map(x => x.hotel);

    relatedRaw = scored;
  }

  // Top up with same-city hotels if fewer than 4 vibe matches
  if (relatedRaw.length < 4) {
    const existingIds = relatedRaw.map(h => h.id);
    const cityFallback = await prisma.hotel.findMany({
      where: {
        status: 'active',
        city: hotel.city,
        slug: { not: params.slug },
        ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
      },
      include: {
        roomTypes: { orderBy: { displayOrder: 'asc' }, take: 1 },
        photos:    { orderBy: { displayOrder: 'asc' }, take: 1 },
      },
      orderBy: [{ isFeatured: 'desc' }, { avgRating: 'desc' }],
      take: 4 - relatedRaw.length,
    }).catch(() => []);
    relatedRaw = [...relatedRaw, ...cityFallback];
  }

  const relatedHotels = relatedRaw.map(h => ({
    id: h.id, name: h.name, slug: h.slug, city: h.city, country: h.country,
    coverImage: h.coverImage ?? null,
    photo: h.photos[0]?.url ?? null,
    discountPercent: h.discountPercent,
    avgRating: (h as any).avgRating ?? null,
    reviewCount: (h as any).reviewCount ?? 0,
    basePrice: h.roomTypes[0]?.pricePerNight ?? null,
  }));

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
    latitude:  (hotel as any).latitude  != null ? Number((hotel as any).latitude)  : null,
    longitude: (hotel as any).longitude != null ? Number((hotel as any).longitude) : null,
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
    redeemedThisMonth,
    lastCouponAt: (hotel as any).lastCouponAt ? (hotel as any).lastCouponAt.toISOString() : null,
  };

  // JSON-LD structured data for Google rich results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: hotel.city,
      addressCountry: hotel.country,
      ...(hotel as any).address ? { streetAddress: (hotel as any).address } : {},
    },
    ...(hotel.coverImage ? { image: hotel.coverImage } : {}),
    ...((hotel as any).avgRating && (hotel as any).reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number((hotel as any).avgRating).toFixed(1),
        reviewCount: (hotel as any).reviewCount,
        bestRating: 5,
      },
    } : {}),
    ...(hotel.roomTypes[0]?.pricePerNight ? {
      priceRange: `From $${Math.round(Number(hotel.roomTypes[0].pricePerNight) * (1 - hotel.discountPercent / 100))}/night`,
    } : {}),
    starRating: { '@type': 'Rating', ratingValue: hotel.starRating },
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com'}/hotels/${hotel.slug}`,
    description: hotel.descriptionShort || `Save ${hotel.discountPercent}% at ${hotel.name} in ${hotel.city}, ${hotel.country}.`,
    makesOffer: {
      '@type': 'Offer',
      description: `${hotel.discountPercent}% discount coupon`,
      eligibleRegion: { '@type': 'Country', name: hotel.country },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HotelPageClient hotel={hotelData} relatedHotels={relatedHotels} />
    </>
  );
}
