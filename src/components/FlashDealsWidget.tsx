'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FlashDeal {
  id: string;
  title: string;
  discountPercent: number;
  endsAt: string;
  hotel: { name: string; slug: string; coverImage: string | null; city: string; country: string };
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return <span className="font-mono text-orange-600 font-bold text-xs">{timeLeft}</span>;
}

export default function FlashDealsWidget() {
  const [deals, setDeals] = useState<FlashDeal[]>([]);

  useEffect(() => {
    fetch('/api/flash-deals').then(r => r.json()).then(d => setDeals(d.deals || []));
  }, []);

  if (deals.length === 0) return null;

  return (
    <section className="py-6 border-b border-gray-100">
      <div className="max-w-[1760px] mx-auto px-6 sm:px-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h2 className="text-base font-bold text-gray-900">Flash Deals</h2>
          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {deals.map(deal => (
            <Link key={deal.id} href={`/hotels/${deal.hotel.slug}`}
              className="flex-shrink-0 w-52 group rounded-2xl overflow-hidden border border-orange-200 bg-white hover:shadow-md transition-shadow">
              <div className="relative h-28 bg-gray-100">
                {deal.hotel.coverImage ? (
                  <img src={deal.hotel.coverImage} alt={deal.hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🏨</div>
                )}
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  ⚡ {deal.discountPercent}% OFF
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-gray-900 truncate">{deal.hotel.name}</p>
                <p className="text-xs text-gray-400 truncate">{deal.hotel.city}, {deal.hotel.country}</p>
                <p className="text-xs text-gray-600 mt-1 truncate">{deal.title}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-gray-400 text-xs">Ends in:</span>
                  <Countdown endsAt={deal.endsAt} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
