import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hotel Destinations Worldwide – BusyBeds',
  description: 'Explore hotel discount coupons across cities and countries worldwide. Browse destinations and save up to 30% on your hotel stay with BusyBeds.',
  keywords: ['hotel deals', 'hotel destinations', 'discount hotels', 'hotel coupons worldwide'],
  alternates: { canonical: '/locations' },
  openGraph: {
    title: 'Hotel Destinations Worldwide – BusyBeds',
    description: 'Explore exclusive hotel discount coupons across the world.',
    type: 'website',
  },
};

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default async function LocationsPage() {
  type HotelRow = { country: string; city: string; discountPercent: number; coverImage: string | null; isFeatured: boolean };
  const allHotels: HotelRow[] = await prisma.hotel.findMany({
    where: { status: 'active' },
    select: { country: true, city: true, discountPercent: true, coverImage: true, isFeatured: true },
    orderBy: [{ isFeatured: 'desc' }, { discountPercent: 'desc' }],
  }).catch(() => [] as HotelRow[]);

  // Group by country
  const countryMap = new Map<string, { hotels: typeof allHotels; maxDiscount: number; coverImg: string | null }>();
  for (const h of allHotels) {
    if (!countryMap.has(h.country)) {
      countryMap.set(h.country, { hotels: [], maxDiscount: 0, coverImg: null });
    }
    const entry = countryMap.get(h.country)!;
    entry.hotels.push(h);
    if (h.discountPercent > entry.maxDiscount) entry.maxDiscount = h.discountPercent;
    if (!entry.coverImg && h.coverImage) entry.coverImg = h.coverImage;
  }
  const countries = Array.from(countryMap.entries()).sort((a, b) => b[1].hotels.length - a[1].hotels.length);

  // Top cities (most hotels)
  const cityMap = new Map<string, { country: string; count: number; maxDiscount: number; coverImg: string | null }>();
  for (const h of allHotels) {
    const key = `${h.country}::${h.city}`;
    if (!cityMap.has(key)) {
      cityMap.set(key, { country: h.country, count: 0, maxDiscount: 0, coverImg: null });
    }
    const entry = cityMap.get(key)!;
    entry.count++;
    if (h.discountPercent > entry.maxDiscount) entry.maxDiscount = h.discountPercent;
    if (!entry.coverImg && h.coverImage) entry.coverImg = h.coverImage;
  }
  const topCities = Array.from(cityMap.entries())
    .map(([key, data]) => ({ city: key.split('::')[1], ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const totalHotels    = allHotels.length;
  const totalCountries = countries.length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Hotel Destinations on BusyBeds',
    numberOfItems: totalCountries,
    itemListElement: countries.slice(0, 20).map(([country], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': 'Country', name: country, url: `https://busybeds.com/locations/${nameToSlug(country)}` },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: 'white' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Locations</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">Hotel Destinations Worldwide</h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl">
            Exclusive discount hotel coupons in {totalCountries} countr{totalCountries !== 1 ? 'ies' : 'y'} and{' '}
            {totalHotels} hotels worldwide. Save up to 30% — no booking fees, instant coupons.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: '🌍', label: `${totalCountries} Countries` },
              { icon: '🏨', label: `${totalHotels} Hotels` },
              { icon: '💰', label: 'Up to 30% OFF' },
              { icon: '🎫', label: 'Free Coupons' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                {s.icon} {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">

        {/* Top Cities */}
        {topCities.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5">🔥 Popular Cities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {topCities.map(c => (
                <Link
                  key={`${c.country}-${c.city}`}
                  href={`/locations/${nameToSlug(c.country)}/${nameToSlug(c.city)}`}
                  className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 aspect-[4/3]"
                >
                  {c.coverImg ? (
                    <Image src={c.coverImg} alt={`Hotels in ${c.city}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                  ) : (
                    <div style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }} className="absolute inset-0" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm">{c.city}</p>
                    <p className="text-white/70 text-xs">{c.country} · {c.count} hotel{c.count !== 1 ? 's' : ''}</p>
                  </div>
                  {c.maxDiscount > 0 && (
                    <div className="absolute top-3 right-3 text-white text-[10px] font-black px-2 py-0.5 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, #E8395A, #C0263D)' }}>
                      {c.maxDiscount}% OFF
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Countries grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5">🌍 All Countries</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map(([country, data]) => (
              <Link
                key={country}
                href={`/locations/${nameToSlug(country)}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 flex"
              >
                <div className="relative w-24 flex-shrink-0">
                  {data.coverImg ? (
                    <Image src={data.coverImg} alt={country} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl"
                      style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
                      🌍
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{country}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{data.hotels.length} hotel{data.hotels.length !== 1 ? 's' : ''}</p>
                    {data.maxDiscount > 0 && (
                      <p className="text-red-500 text-xs font-bold mt-1">Up to {data.maxDiscount}% off</p>
                    )}
                  </div>
                  <svg className="flex-shrink-0 text-gray-300 group-hover:text-teal-500 transition-colors" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E7C7B 100%)' }}>
          <h3 className="text-xl font-extrabold text-white mb-2">Can't find your destination?</h3>
          <p className="text-white/70 text-sm mb-4">Use the search on our homepage to find hotels anywhere in the world.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl text-teal-900 bg-white hover:opacity-90 transition-opacity">
            🔍 Search All Hotels
          </Link>
        </div>
      </div>
    </div>
  );
}
