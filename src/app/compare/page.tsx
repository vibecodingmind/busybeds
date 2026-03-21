import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';

export default async function ComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = searchParams.ids?.split(',').filter(Boolean).slice(0, 3) || [];
  if (ids.length < 2) notFound();

  const hotels = await prisma.hotel.findMany({
    where: { id: { in: ids } },
    include: { roomTypes: { orderBy: { pricePerNight: 'asc' }, take: 1 } },
  });

  if (hotels.length < 2) notFound();

  const rows = [
    { label: 'Location', render: (h: any) => `${h.city}, ${h.country}` },
    { label: 'Star Rating', render: (h: any) => '★'.repeat(h.starRating) + '☆'.repeat(5 - h.starRating) },
    { label: 'Discount', render: (h: any) => <span className="font-bold text-[#E8395A] text-lg">{h.discountPercent}% OFF</span> },
    { label: 'Category', render: (h: any) => h.category },
    { label: 'Avg Rating', render: (h: any) => h.avgRating ? `⭐ ${h.avgRating.toFixed(1)} (${h.reviewCount} reviews)` : 'No reviews yet' },
    { label: 'Starting Price', render: (h: any) => h.roomTypes[0] ? `$${h.roomTypes[0].pricePerNight}/night` : 'Contact hotel' },
    { label: 'Coupon Valid', render: (h: any) => `${h.couponValidDays} days` },
    { label: 'Address', render: (h: any) => h.address || h.city },
    { label: 'Website', render: (h: any) => h.websiteUrl ? <a href={h.websiteUrl} target="_blank" className="text-blue-600 hover:underline text-sm">Visit site</a> : '—' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Compare Hotels</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Header row */}
          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `200px repeat(${hotels.length}, 1fr)` }}>
            <div className="p-4" />
            {hotels.map(h => (
              <div key={h.id} className="p-4 text-center border-l border-gray-100">
                {h.coverImage && <img src={h.coverImage} alt={h.name} className="w-full h-32 object-cover rounded-xl mb-3" />}
                <h3 className="font-bold text-gray-900">{h.name}</h3>
                <p className="text-sm text-gray-500">{h.city}, {h.country}</p>
                <Link href={`/hotels/${h.slug}`}
                  className="mt-3 inline-block px-4 py-1.5 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                  style={{ background: '#E8395A' }}>
                  Get Coupon
                </Link>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          {rows.map((row, i) => (
            <div key={row.label} className={`grid border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}
              style={{ gridTemplateColumns: `200px repeat(${hotels.length}, 1fr)` }}>
              <div className="p-4 font-semibold text-sm text-gray-600 flex items-center">{row.label}</div>
              {hotels.map(h => (
                <div key={h.id} className="p-4 text-center border-l border-gray-100 text-sm text-gray-800 flex items-center justify-center">
                  {row.render(h)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
