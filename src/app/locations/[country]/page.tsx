import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

interface Props {
  params: { country: string };
}

function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const countryName = slugToName(params.country);
  const count = await prisma.hotel.count({
    where: { status: 'active', country: { contains: countryName } },
  }).catch(() => 0);

  const title       = `Hotels in ${countryName} – Exclusive Discounts | BusyBeds`;
  const description = `Browse ${count > 0 ? count + ' ' : ''}hotels across ${countryName} with exclusive discount coupons. Save up to 30% on your stay — no booking fees.`;

  return {
    title,
    description,
    keywords: [`hotels in ${countryName}`, `${countryName} hotel deals`, `${countryName} discount hotels`, 'hotel coupons'],
    alternates: { canonical: `/locations/${params.country}` },
    openGraph: { title, description, type: 'website', url: `/locations/${params.country}` },
  };
}

export default async function CountryPage({ params }: Props) {
  const countryName = slugToName(params.country);

  const hotels = await prisma.hotel.findMany({
    where: {
      status: 'active',
      country: { contains: countryName },
    },
    include: {
      roomTypes: { orderBy: { pricePerNight: 'asc' }, take: 1 },
      reviews: { where: { isApproved: true }, select: { rating: true }, take: 50 },
    },
    orderBy: [{ isFeatured: 'desc' }, { discountPercent: 'desc' }],
  });

  if (hotels.length === 0) notFound();

  // Group by city
  const cityMap = new Map<string, typeof hotels>();
  for (const hotel of hotels) {
    if (!cityMap.has(hotel.city)) cityMap.set(hotel.city, []);
    cityMap.get(hotel.city)!.push(hotel);
  }
  const cities = Array.from(cityMap.entries()).sort((a, b) => b[1].length - a[1].length);

  const maxDiscount = Math.max(...hotels.map(h => h.discountPercent));
  const avgDiscount = Math.round(hotels.reduce((s, h) => s + h.discountPercent, 0) / hotels.length);
  const minPrice    = Math.min(...hotels.map(h => h.roomTypes[0]?.pricePerNight ?? 999));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Hotels in ${countryName}`,
    description: `Exclusive hotel deals and discount coupons across ${countryName}`,
    numberOfItems: hotels.length,
    itemListElement: cities.slice(0, 10).map(([city], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'City',
        name: city,
        containedInPlace: { '@type': 'Country', name: countryName },
        url: `https://busybeds.com/locations/${params.country}/${nameToSlug(city)}`,
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
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/locations" className="hover:text-white transition-colors">Locations</Link>
            <span>/</span>
            <span className="text-white">{countryName}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
            Hotels in {countryName}
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl">
            Explore {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} across {cities.length} cit{cities.length !== 1 ? 'ies' : 'y'} in {countryName}.
            Get exclusive coupons with up to <strong className="text-white">{maxDiscount}% off</strong>.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: '🏨', label: `${hotels.length} Hotels` },
              { icon: '🏙', label: `${cities.length} Cities` },
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
        {/* Cities */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Browse by City</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cities.map(([city, cityHotels]) => {
              const maxCityDiscount = Math.max(...cityHotels.map(h => h.discountPercent));
              const coverImg = cityHotels.find(h => h.coverImage)?.coverImage;
              return (
                <Link
                  key={city}
                  href={`/locations/${params.country}/${nameToSlug(city)}`}
                  className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 aspect-[4/3]"
                >
                  {coverImg ? (
                    <Image src={coverImg} alt={`Hotels in ${city}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                  ) : (
                    <div style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }} className="absolute inset-0" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm">{city}</p>
                    <p className="text-white/70 text-xs">{cityHotels.length} hotel{cityHotels.length !== 1 ? 's' : ''} · up to {maxCityDiscount}% off</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Top picks */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Top Deals in {countryName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.slice(0, 12).map(hotel => {
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
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                      alt={`${hotel.name} – ${hotel.city}`}
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
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full">⭐ FEATURED</div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white/80 text-xs">📍 {hotel.city}</p>
                      <h3 className="text-white text-sm font-bold leading-tight drop-shadow-sm line-clamp-1">{hotel.name}</h3>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-0.5 mb-0.5">
                        {[...Array(hotel.starRating)].map((_, i) => <span key={i} className="text-yellow-400 text-[10px]">★</span>)}
                      </div>
                      {avgRating && <span className="text-[10px] text-yellow-700 font-bold">⭐ {avgRating.toFixed(1)} ({hotel.reviews.length})</span>}
                      {fromPrice && <p className="text-xs text-teal-700 font-semibold mt-0.5">From ${fromPrice}/night</p>}
                    </div>
                    <span className="text-xs font-bold text-white px-3 py-1.5 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
                      Get Coupon
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          {hotels.length > 12 && (
            <div className="text-center mt-6">
              <p className="text-gray-500 text-sm mb-3">Showing 12 of {hotels.length} hotels in {countryName}</p>
              <Link
                href={`/?country=${encodeURIComponent(countryName)}`}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
              >
                View all {hotels.length} hotels
              </Link>
            </div>
          )}
        </div>

        {/* SEO block */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Discover Hotels in {countryName}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {countryName} is home to some of the world's most exciting hotel destinations. BusyBeds partners
            with {hotels.length} verified hotel{hotels.length !== 1 ? 's' : ''} across {cities.length} cit{cities.length !== 1 ? 'ies' : 'y'} to
            bring you exclusive discount coupons worth up to {maxDiscount}% off your stay. All coupons are free
            to generate and are redeemed directly at the hotel — no booking fees, no hidden charges.
          </p>
        </div>
      </div>
    </div>
  );
}
