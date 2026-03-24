'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  discountPercent: number;
  starRating: number;
  avgRating: number | null;
  coverImage: string | null;
  category: string;
  roomTypes: Array<{ pricePerNight: number }>;
}

export default function MapClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const { format } = useCurrency();

  const fetchHotels = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (minDiscount) params.set('minDiscount', minDiscount);
    const res = await fetch(`/api/hotels/map?${params}`);
    const data = await res.json();
    return data.hotels || [];
  }, [search, minDiscount]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if ((window as any).L) {
      initMap();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;

    const map = L.map(mapRef.current, {
      center: [0, 20],
      zoom: 3,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;
    loadMarkers(map);
  }, []);

  const loadMarkers = useCallback(async (mapInstance?: any) => {
    const L = (window as any).L;
    const map = mapInstance || mapInstanceRef.current;
    if (!map || !L) return;

    setLoading(true);
    const data = await fetchHotels();
    setHotels(data);

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filter hotels with valid coordinates
    const withCoords = data.filter((h: Hotel) => h.latitude && h.longitude);

    withCoords.forEach((hotel: Hotel) => {
      // Custom pin with discount badge
      const iconHtml = `
        <div style="
          background: #FF385C; color: white; font-weight: 700; font-size: 11px;
          padding: 4px 8px; border-radius: 20px; white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25); cursor: pointer;
          border: 2px solid white; transform-origin: bottom center;
          transition: transform 0.1s;
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

      markersRef.current.push(marker);
    });

    setLoading(false);

    // Auto-fit bounds if we have markers
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((h: Hotel) => [h.latitude, h.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [fetchHotels]);

  // Reload markers when filters change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => loadMarkers(), 400);
    return () => clearTimeout(timer);
  }, [search, minDiscount, loadMarkers]);

  const flyTo = (hotel: Hotel) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([hotel.latitude, hotel.longitude], 14, { duration: 1 });
  };

  const basePrice = selected?.roomTypes[0]?.pricePerNight ?? null;
  const discountedPrice = basePrice ? Math.round(basePrice * (1 - (selected?.discountPercent ?? 0) / 100)) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by city or hotel name…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
          />
        </div>

        <select value={minDiscount} onChange={e => setMinDiscount(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
          <option value="">Any discount</option>
          <option value="10">10%+ off</option>
          <option value="20">20%+ off</option>
          <option value="30">30%+ off</option>
          <option value="50">50%+ off</option>
        </select>

        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {loading ? 'Loading…' : `${hotels.filter(h => h.latitude && h.longitude).length} hotels`}
        </span>

        {/* Link back to list view */}
        <a href="/" className="ml-auto text-sm text-[#FF385C] hover:underline font-medium whitespace-nowrap flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          List view
        </a>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map */}
        <div ref={mapRef} className="flex-1 z-0" />

        {/* Hotel detail card on pin click */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm mx-4 z-[1000]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="relative">
                <img
                  src={selected.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                  alt={selected.name}
                  className="w-full h-40 object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'; }}
                />
                <div className="absolute top-3 left-3 bg-[#FF385C] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {selected.discountPercent}% OFF
                </div>
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{selected.name}</h3>
                  {selected.avgRating && (
                    <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {selected.avgRating.toFixed(1)}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.city}, {selected.country}</p>
                {discountedPrice && (
                  <p className="text-sm mt-1">
                    <span className="line-through text-gray-400 mr-1">{format(basePrice!)}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{format(discountedPrice)}</span>
                    <span className="text-gray-500"> / night</span>
                  </p>
                )}
                <a href={`/hotels/${selected.slug}`}
                  className="mt-3 block w-full py-2.5 bg-[#FF385C] hover:bg-[#e0334f] text-white text-sm font-semibold text-center rounded-xl transition-colors">
                  View Deal →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 z-[999]">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md text-sm text-gray-600 dark:text-gray-300">
              <div className="w-4 h-4 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
              Loading hotels…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
