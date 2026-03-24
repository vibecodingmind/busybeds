import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

interface Props {
  params: { country: string; city: string };
}

function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityName    = slugToName(params.city);
  const countryName = slugToName(params.country);

  const count = await prisma.hotel.count({
    where: {
      status: 'active',
      city: { contains: cityName, mode: 'insensitive' },
      country: { contains: countryName, mode: 'insensitive' },
    },
  }).catch(() => 0);

  const title       = `Hotels in ${cityName}, ${countryName} – Up to 30% Off | BusyBeds`;
  const description = `Discover ${count > 0 ? count + ' ' : ''}hotels in ${cityName}, ${countryName} with exclusive discount coupons. Save up to 30% on your stay with BusyBeds. No booking fees.`;

  return {
    title,
    description,
    keywords: [`hotels in ${cityName}`, `${cityName} hotel deals`, `${cityName} discount hotels`, `${countryName} hotels`, 'hotel coupons'],
    alternates: { canonical: `/locations/${params.country}/${params.city}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/locations/${params.country}/${params.city}`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const cityName    = slugToName(params.city);
  const countryName = slugToName(params.country);

  const hotels = await prisma.hotel.findMany({
    where: {
      status: 'active',
      city: { contains: cityName, mode: 'insensitive' },
      country: { contains: countryName, mode: 'insensitive' },
    },
    include: {
      roomTypes: { orderBy: { pricePerNight: 'asc' }, take: 1 },
      reviews: { where: { isApproved: true }, select: { rating: true }, take: 100 },
    },
    orderBy: [{ isFeatured: 'desc' }, { discountPercent: 'desc' }],
  });

  if (hotels.length === 0) notFound();

  const avgDiscount = Math.round(hotels.reduce((s, h) => s + h.discountPercent, 0) / hotels.length);
  const maxDiscount = Math.max(...hotels.map(h => h.discountPercent));
  const minPrice    = Math.min(...hotels.map(h => h.roomTypes[0]?.pricePerNight ?? 999));

  // Nearby cities in same country
  const nearbyCities = await prisma.hotel.findMany({
    where: {
      status: 'active',
      country: { contains: countryName, mode: 'insensitive' },
      NOT: { city: { contains: cityName, mode: 'insensitive' } },
    },
    select: { city: true },
    distinct: ['city'],
    take: 8,
  }).catch(() => []);

  // Schema.org JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Hotels in ${cityName}, ${countryName}`,
    description: `Exclusive hotel deals and discount coupons in ${cityName}`,
    numberOfItems: hotels.length,
    itemListElement: hotels.slice(0, 10).map((h, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Hotel',
        name: h.name,
        url: `https://busybeds.com/hotels/${h.slug}`,
        image: h.coverImage || undefined,
        address: { '@type': 'PostalAddress', addressLocality: h.city, addressCountry: h.country },
        starRating: { '@type': 'Rating', ratingValue: h.starRating },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: 'white' }} />
        <div className="absolute -bottom-12 -left-12 w-60 h-60 rounded-full opacity-[0.05]" style={{ background: 'white' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/locations" className="hover:text-white transition-colors">Locations</Link>
            <span>/</span>
            <Link href={`/locations/${params.country}`} className="hover:text-white transition-colors">{countryName}</Link>
            <span>/</span>
            <span className="text-white">{cityName}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
            Hotels in {cityName}
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl">
            {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} in {cityName}, {countryName} with exclusive BusyBeds
            discount coupons. Save up to <strong className="text-white">{maxDiscount}% off</strong> — no booking fees.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: '🏨', label: `${hotels.length} Hotels` },
              { icon: '💰', label: `Up to ${maxDiscount}% OFF` },
              { icon: '📊', label: `Avg ${avgDiscount}% discount` },
              ...(minPrice < 999 ? [{ icon: '🛏', label: `From $${minPrice}/night` }] : []),
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                {s.icon} {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Hotel grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotels.map(hotel => {
            const avgRating = hotel.reviews.length
              ? hotel.reviews.reduce((s, r) => s + r.rating, 0) / hotel.reviews.length
              : null;
            const fromPrice = hotel.roomTypes[0]?.pricePerNight;

            return (
              <Link
                key={hotel.id}
                href={`/hotels/${hotel.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                    alt={`${hotel.name} – ${cityName}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div
                    className="absolute top-3 left-3 text-white text-xs font-black px-2.5 py-1 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #E8395A, #C0263D)' }}
                  >
                    {hotel.discountPercent}% OFF
                  </div>
                  {hotel.isFeatured && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                      ⭐ FEATURED
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[...Array(hotel.starRating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-[10px]">★</span>
                      ))}
                    </div>
                    <h2 className="text-white text-sm font-bold leading-tight drop-shadow-sm line-clamp-2">{hotel.name}</h2>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{hotel.category}</span>
                    {avgRating && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 font-bold px-2 py-0.5 rounded-full">
                        ⭐ {avgRating.toFixed(1)} ({hotel.reviews.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      {fromPrice && (
                        <span className="text-teal-700 font-bold text-sm">
                          From ${fromPrice}<span className="text-gray-400 font-normal">/night</span>
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs font-bold text-white px-3 py-1.5 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
                    >
                      Get Coupon →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Nearby cities */}
        {nearbyCities.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">More cities in {countryName}</h2>
            <div className="flex flex-wrap gap-2">
              {nearbyCities.map(nc => (
                <Link
                  key={nc.city}
                  href={`/locations/${params.country}/${nameToSlug(nc.city)}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-teal-400 hover:text-teal-700 transition-colors shadow-sm"
                >
                  📍 {nc.city}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SEO content block */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Hotel Deals in {cityName}, {countryName}
          </h2>
          <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
            <p>
              BusyBeds features <strong>{hotels.length} verified hotel{hotels.length !== 1 ? 's' : ''} in {cityName}, {countryName}</strong> with
              exclusive discount coupons averaging <strong>{avgDiscount}% off</strong>. From budget guesthouses to
              luxury {hotels.some(h => h.starRating >= 5) ? '5-star' : '4-star'} properties, every hotel on
              BusyBeds offers a unique QR coupon you can redeem at check-in — no booking fees, no hidden charges.
            </p>
            <p>
              The top discount in {cityName} right now is <strong>{maxDiscount}% off</strong>
              {minPrice < 999 ? `, with rooms starting from $${Math.round(minPrice)}/night after your coupon` : ''}.
              Subscribe to any BusyBeds plan to unlock instant coupons for all hotels.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Frequently Asked Questions</h3>
            {[
              {
                q: `How do hotel coupons work in ${cityName}?`,
                a: `Subscribe to BusyBeds, generate a QR coupon for your chosen hotel, and present it at the front desk on arrival. The hotel staff scan it and apply your ${avgDiscount}% average discount instantly.`,
              },
              {
                q: `Are the discounts real?`,
                a: `Yes. Every hotel on BusyBeds has agreed to honour the listed discount. Coupons are single-use, verified, and expire after ${hotels[0]?.couponValidDays ?? 30} days — so they're fraud-proof for hotels too.`,
              },
              {
                q: `Do I need to book in advance?`,
                a: `No. BusyBeds coupons are walk-in discounts. You can generate a coupon and head to the hotel same-day. No pre-booking or reservation required.`,
              },
            ].map(item => (
              <details key={item.q} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-semibold text-gray-800 hover:bg-gray-50 list-none">
                  {item.q}
                  <svg className="flex-shrink-0 ml-2 transition-transform group-open:rotate-180" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="mt-6 rounded-2xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E7C7B 100%)' }}
        >
          <h3 className="text-xl font-extrabold text-white mb-2">
            Don't see your preferred hotel?
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Browse all hotels across {countryName} and beyond.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href={`/locations/${params.country}`}
              className="px-5 py-2.5 bg-white text-teal-800 font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              All hotels in {countryName}
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 font-bold rounded-xl text-sm text-white hover:opacity-90 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)' }}
            >
              Browse all hotels
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
