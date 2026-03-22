'use client';
import { useTripPlanner } from '@/hooks/useTripPlanner';

interface Props {
  hotel: {
    hotelId: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    coverImage: string | null;
    starRating: number;
  };
  size?: 'sm' | 'md';
}

export default function AddToTripButton({ hotel, size = 'sm' }: Props) {
  const { addHotel, removeHotel, isInPlan } = useTripPlanner();
  const inPlan = isInPlan(hotel.hotelId);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inPlan) {
      removeHotel(hotel.hotelId);
    } else {
      addHotel(hotel);
    }
  };

  const wh = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';

  return (
    <button
      onClick={toggle}
      title={inPlan ? 'Remove from trip plan' : 'Add to trip plan'}
      className={`${wh} rounded-full flex items-center justify-center shadow-md transition-all duration-200 backdrop-blur-sm ${
        inPlan
          ? 'text-white scale-105'
          : 'bg-white/85 text-gray-600 hover:bg-white hover:scale-105'
      }`}
      style={inPlan ? { background: '#FF385C' } : {}}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    </button>
  );
}
