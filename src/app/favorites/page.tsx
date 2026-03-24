import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import FavoriteButton from '@/components/FavoriteButton';
import PageHeader from '@/components/PageHeader';

async function getFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      hotel: {
        include: {
          roomTypes: { take: 1, orderBy: { displayOrder: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return favorites.map(f => f.hotel);
}

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/favorites');

  const hotels = await getFavorites(session.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <PageHeader
        title="Saved Hotels"
        emoji="❤️"
        subtitle={`${hotels.length} hotel${hotels.length !== 1 ? 's' : ''} saved`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

        {hotels.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No saved hotels yet</h2>
            <p className="text-gray-500 mb-6">
              Browse hotels and tap the heart icon to save your favorites for later.
            </p>
            <Link href="/" className="btn-primary inline-block">
              Browse Hotels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map(hotel => (
              <Link key={hotel.id} href={`/hotels/${hotel.slug}`} className="card hover:shadow-md transition-shadow group">
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  <img
                    src={hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {hotel.isFeatured && (
                    <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      ⭐ Featured
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 bg-teal-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {hotel.discountPercent}% OFF
                  </div>
                  <div className="absolute top-3 right-3">
                    <div onClick={(e) => e.preventDefault()}>
                      <FavoriteButton hotelId={hotel.id} initialFavorited={true} size="sm" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{hotel.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">📍 {hotel.city}, {hotel.country}</p>
                    </div>
                    <div className="text-yellow-400 text-sm font-medium flex-shrink-0">{'★'.repeat(hotel.starRating)}</div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{hotel.descriptionShort}</p>
                  {hotel.roomTypes[0] && (() => {
                    const orig = hotel.roomTypes[0].pricePerNight;
                    const disc = Math.round(orig * (1 - hotel.discountPercent / 100));
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">From</span>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 line-through mr-1">${orig}/night</span>
                          <span className="font-bold text-sm" style={{ color: '#0E7C7B' }}>${disc}/night</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
