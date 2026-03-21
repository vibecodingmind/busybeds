import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

interface Props { searchParams: { ids?: string } }

export default async function ComparePage({ searchParams }: Props) {
  const ids = (searchParams.ids || '').split(',').filter(Boolean).slice(0, 3);
  if (ids.length < 2) notFound();

  const hotels = await prisma.hotel.findMany({
    where: { id: { in: ids } },
    include: {
      roomTypes: { orderBy: { pricePerNight: 'asc' } },
      reviews: { where: { isApproved: true }, select: { rating: true }, take: 100 },
    },
  });

  if (hotels.length < 2) notFound();

  // Build amenity union across all hotels for comparison matrix
  const allAmenities = Array.from(
    new Set(hotels.flatMap(h => JSON.parse(h.amenities || '[]') as string[]))
  ).sort();

  const hotelAmenities = hotels.map(h => new Set(JSON.parse(h.amenities || '[]') as string[]));

  // Best values highlighting
  const maxDiscount = Math.max(...hotels.map(h => h.discountPercent));
  const maxStars = Math.max(...hotels.map(h => h.starRating));
  const minPrice = Math.min(...hotels.map(h => h.roomTypes[0]?.pricePerNight || Infinity));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
            Back
          </Link>
          <span className="text-gray-300">·</span>
          <h1 className="text-xl font-extrabold text-gray-900">Compare Hotels ({hotels.length})</h1>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: hotels.length === 3 ? '700px' : '500px' }}>
            {/* Hotel cards header */}
            <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `180px repeat(${hotels.length}, 1fr)` }}>
              <div />
              {hotels.map((h, idx) => (
                <div key={h.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="relative h-32">
                    <Image
                      src={h.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={h.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {/* Discount badge */}
                    <div
                      className="absolute top-2 right-2 text-white text-xs font-black px-2 py-1 rounded-lg"
                      style={{ background: h.discountPercent === maxDiscount ? '#E8395A' : '#374151' }}
                    >
                      {h.discountPercent === maxDiscount && <span className="mr-0.5">🏆</span>}
                      {h.discountPercent}% OFF
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        Your Pick
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[...Array(h.starRating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xs">★</span>
                      ))}
                      {[...Array(5 - h.starRating)].map((_, i) => (
                        <span key={i} className="text-gray-200 text-xs">★</span>
                      ))}
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">{h.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{h.city}, {h.country}</p>
                    {h.avgRating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs bg-yellow-50 text-yellow-700 font-bold px-1.5 py-0.5 rounded">
                          ⭐ {h.avgRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">({h.reviewCount})</span>
                      </div>
                    )}
                    <Link
                      href={`/hotels/${h.slug}`}
                      className="mt-2 block text-center py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #E8395A, #C0263D)' }}
                    >
                      Get {h.discountPercent}% Coupon
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Section: Key Stats */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">📊 Key Stats</span>
              </div>

              {[
                {
                  label: 'Discount',
                  render: (h: typeof hotels[0]) => (
                    <span className={`text-lg font-black ${h.discountPercent === maxDiscount ? 'text-red-500' : 'text-gray-700'}`}>
                      {h.discountPercent === maxDiscount && '🏆 '}
                      {h.discountPercent}%
                    </span>
                  ),
                },
                {
                  label: 'Stars',
                  render: (h: typeof hotels[0]) => (
                    <span className={`font-bold ${h.starRating === maxStars ? 'text-yellow-500' : 'text-gray-500'}`}>
                      {'★'.repeat(h.starRating)}{'☆'.repeat(5 - h.starRating)}
                    </span>
                  ),
                },
                {
                  label: 'Guest Rating',
                  render: (h: typeof hotels[0]) => h.avgRating
                    ? <span className="font-bold text-yellow-600">⭐ {h.avgRating.toFixed(1)} <span className="text-gray-400 font-normal text-xs">({h.reviewCount})</span></span>
                    : <span className="text-gray-400 text-sm">No reviews</span>,
                },
                {
                  label: 'From / Night',
                  render: (h: typeof hotels[0]) => {
                    const price = h.roomTypes[0]?.pricePerNight;
                    return price
                      ? <span className={`font-bold ${price === minPrice ? 'text-teal-600' : 'text-gray-700'}`}>
                          {price === minPrice && '💰 '}${price}
                        </span>
                      : <span className="text-gray-400 text-sm">—</span>;
                  },
                },
                {
                  label: 'Coupon Valid',
                  render: (h: typeof hotels[0]) => <span className="text-sm text-gray-700">{h.couponValidDays} days</span>,
                },
                {
                  label: 'Category',
                  render: (h: typeof hotels[0]) => <span className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{h.category}</span>,
                },
                {
                  label: 'Location',
                  render: (h: typeof hotels[0]) => <span className="text-sm text-gray-600">{h.city}, {h.country}</span>,
                },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`grid border-b border-gray-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                  style={{ gridTemplateColumns: `180px repeat(${hotels.length}, 1fr)` }}
                >
                  <div className="px-4 py-3 text-sm font-semibold text-gray-500 flex items-center">{row.label}</div>
                  {hotels.map(h => (
                    <div key={h.id} className="px-4 py-3 text-center border-l border-gray-50 flex items-center justify-center">
                      {row.render(h)}
                    </div>
                  ))}
                </div>
              ))}

              {/* Section: Room Types */}
              {hotels.some(h => h.roomTypes.length > 0) && (
                <>
                  <div className="px-4 py-3 bg-gray-50 border-t border-b border-gray-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">🛏 Room Types</span>
                  </div>
                  <div className="grid border-b border-gray-50" style={{ gridTemplateColumns: `180px repeat(${hotels.length}, 1fr)` }}>
                    <div className="px-4 py-3 text-sm font-semibold text-gray-500">Available Rooms</div>
                    {hotels.map(h => (
                      <div key={h.id} className="px-4 py-3 border-l border-gray-50">
                        {h.roomTypes.length === 0 ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          <ul className="space-y-1">
                            {h.roomTypes.slice(0, 4).map(r => (
                              <li key={r.id} className="text-xs text-gray-600 flex items-center justify-between gap-1">
                                <span className="truncate">{r.name}</span>
                                <span className="text-teal-600 font-semibold flex-shrink-0">${r.pricePerNight}/n</span>
                              </li>
                            ))}
                            {h.roomTypes.length > 4 && <li className="text-xs text-gray-400">+{h.roomTypes.length - 4} more</li>}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Section: Amenities */}
              {allAmenities.length > 0 && (
                <>
                  <div className="px-4 py-3 bg-gray-50 border-t border-b border-gray-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">✨ Amenities</span>
                  </div>
                  {allAmenities.slice(0, 20).map((amenity, i) => (
                    <div
                      key={amenity}
                      className={`grid border-b border-gray-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                      style={{ gridTemplateColumns: `180px repeat(${hotels.length}, 1fr)` }}
                    >
                      <div className="px-4 py-2.5 text-sm text-gray-600 flex items-center">{amenity}</div>
                      {hotelAmenities.map((amenSet, idx) => (
                        <div key={idx} className="px-4 py-2.5 text-center border-l border-gray-50 flex items-center justify-center">
                          {amenSet.has(amenity) ? (
                            <span className="text-teal-500 font-bold text-lg" title="Available">✓</span>
                          ) : (
                            <span className="text-gray-200 text-lg" title="Not available">✕</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  {allAmenities.length > 20 && (
                    <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-50">
                      +{allAmenities.length - 20} more amenities
                    </div>
                  )}
                </>
              )}
            </div>

            {/* CTA row */}
            <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: `180px repeat(${hotels.length}, 1fr)` }}>
              <div />
              {hotels.map(h => (
                <Link
                  key={h.id}
                  href={`/hotels/${h.slug}`}
                  className="block text-center py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] shadow-md"
                  style={{ background: h.discountPercent === maxDiscount ? 'linear-gradient(135deg,#E8395A,#C0263D)' : '#1A3C5E' }}
                >
                  Get {h.discountPercent}% at {h.name.split(' ')[0]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
