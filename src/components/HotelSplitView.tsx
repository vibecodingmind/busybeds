'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import HotelCard from './HotelCard';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';
import { HotelGridSkeleton } from './Skeleton';
import { useInfiniteHotels } from '@/hooks/useInfiniteHotels';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialHotels: any[];
  searchParams: Record<string, string | undefined>;
  pageSize?: number;
  viewMode: 'list' | 'map';
  onHoverHotel?: (hotelId: string | null) => void;
}

export default function HotelSplitView({
  initialHotels,
  searchParams,
  pageSize = 18,
  viewMode,
  onHoverHotel,
}: Props) {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && k !== 'page') params[k] = v;
  }

  const { hotels, loading, hasMore, loadMore } = useInfiniteHotels({
    initialHotels,
    pageSize,
    params,
  });

  const handleLoadMore = useCallback(() => { loadMore(); }, [loadMore]);

  // List view - normal grid
  if (viewMode === 'list') {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 gap-y-8">
          {hotels.map((hotel: any) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
        {loading && !hotels.length && <HotelGridSkeleton count={pageSize} />}
        <InfiniteScrollTrigger
          onIntersect={handleLoadMore}
          loading={loading}
          hasMore={hasMore}
        />
      </>
    );
  }

  // Map view - split layout
  return (
    <div className="flex gap-6 min-h-[calc(100vh-300px)]">
      {/* Left side - Hotel list */}
      <div className="w-full lg:w-[55%] xl:w-[50%]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hotels.map((hotel: any) => (
            <div
              key={hotel.id}
              onMouseEnter={() => onHoverHotel?.(hotel.id)}
              onMouseLeave={() => onHoverHotel?.(null)}
              className="transition-transform duration-200"
            >
              <HotelCard hotel={hotel} />
            </div>
          ))}
        </div>
        {loading && !hotels.length && <HotelGridSkeleton count={pageSize} />}
        <InfiniteScrollTrigger
          onIntersect={handleLoadMore}
          loading={loading}
          hasMore={hasMore}
        />
      </div>

      {/* Right side - Map (sticky) */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[50%]">
        <div className="sticky top-24 h-[calc(100vh-120px)] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <HotelMap hotels={hotels} hoveredHotelId={null} />
        </div>
      </div>
    </div>
  );
}

// Map component using Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HotelMap({ hotels, hoveredHotelId }: { hotels: any[]; hoveredHotelId: string | null }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      const map = L.map(mapRef.current, {
        center: [-6.3690, 34.8888], // Tanzania center
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    // Load CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load JS
    if ((window as any).L) {
      loadMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = loadMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when hotels change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Filter hotels with valid coordinates
    const withCoords = hotels.filter((h) => h.latitude && h.longitude);

    withCoords.forEach((hotel) => {
      const isHovered = hoveredHotelId === hotel.id;

      const iconHtml = `
        <div style="
          background: ${isHovered ? '#E8395A' : '#FF385C'};
          color: white;
          font-weight: 700;
          font-size: ${isHovered ? '12px' : '11px'};
          padding: ${isHovered ? '5px 10px' : '4px 8px'};
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          border: 2px solid white;
          transform: ${isHovered ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.15s ease;
        ">
          ${hotel.discountPercent}% off
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconAnchor: [30, 20],
      });

      const marker = L.marker([hotel.latitude, hotel.longitude], { icon })
        .addTo(map)
        .on('click', () => setSelected(hotel));

      markersRef.current.set(hotel.id, marker);
    });

    // Fit bounds if we have markers
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(
        withCoords.map((h) => [h.latitude, h.longitude])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [hotels, hoveredHotelId]);

  // Highlight hovered hotel
  useEffect(() => {
    if (!mapInstanceRef.current || !hoveredHotelId) return;

    const hotel = hotels.find((h) => h.id === hoveredHotelId);
    if (hotel?.latitude && hotel?.longitude) {
      mapInstanceRef.current.flyTo([hotel.latitude, hotel.longitude], 14, {
        duration: 0.5,
      });
    }
  }, [hoveredHotelId, hotels]);

  const basePrice = selected?.roomTypes[0]?.pricePerNight ?? null;
  const discountedPrice = basePrice
    ? Math.round(basePrice * (1 - (selected?.discountPercent ?? 0) / 100))
    : null;

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Selected hotel popup */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-sm mx-auto">
            <div className="relative h-32">
              <img
                src={
                  selected.coverImage ||
                  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
                }
                alt={selected.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-[#FF385C] text-white text-xs font-bold px-2 py-1 rounded-full">
                {selected.discountPercent}% OFF
              </div>
              <button
                onClick={() => setSelected(null)}
                className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-gray-900 text-sm">{selected.name}</h3>
              <p className="text-xs text-gray-500">
                {selected.city}, {selected.country}
              </p>
              {discountedPrice && (
                <p className="text-xs mt-1">
                  <span className="line-through text-gray-400 mr-1">${basePrice}</span>
                  <span className="font-bold text-gray-900">${discountedPrice}</span>
                  <span className="text-gray-500"> / night</span>
                </p>
              )}
              <a
                href={`/hotels/${selected.slug}`}
                className="mt-2 block w-full py-2 bg-[#FF385C] hover:bg-[#e0334f] text-white text-xs font-semibold text-center rounded-lg transition-colors"
              >
                View Deal →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
