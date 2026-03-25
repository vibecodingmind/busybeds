'use client';

import { useMemo } from 'react';

interface Landmark {
  id: string;
  name: string;
  type: string;
  typeName: string;
  address: string | null;
  distanceKm: number;
  rating: number | null;
  totalRatings: number;
}

interface HotelLandmarksProps {
  landmarks: Landmark[];
}

// Icons for landmark types
const LANDMARK_ICONS: Record<string, string> = {
  supermarket: '🛒',
  shopping_mall: '🛍️',
  grocery_or_supermarket: '🏪',
  park: '🌳',
  hospital: '🏥',
  pharmacy: '💊',
  atm: '🏧',
  bank: '🏦',
  restaurant: '🍽️',
  cafe: '☕',
  gas_station: '⛽',
  tourist_attraction: '🏛️',
  museum: '🏛️',
  transit_station: '🚉',
  airport: '✈️',
};

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export default function HotelLandmarks({ landmarks }: HotelLandmarksProps) {
  // Group landmarks by type
  const groupedLandmarks = useMemo(() => {
    const groups: Record<string, Landmark[]> = {};
    
    for (const landmark of landmarks) {
      if (!groups[landmark.typeName]) {
        groups[landmark.typeName] = [];
      }
      groups[landmark.typeName].push(landmark);
    }
    
    // Sort each group by distance
    for (const type in groups) {
      groups[type].sort((a, b) => a.distanceKm - b.distanceKm);
    }
    
    return groups;
  }, [landmarks]);

  if (landmarks.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">📍</span>
        Nearby Landmarks
      </h2>
      
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-500">
            {landmarks.length} popular places within 5km
          </p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {Object.entries(groupedLandmarks).map(([typeName, items]) => (
            <div key={typeName} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">
                  {LANDMARK_ICONS[items[0]?.type] || '📍'}
                </span>
                <h3 className="font-semibold text-gray-800 text-sm">
                  {typeName}
                </h3>
                <span className="text-xs text-gray-400 font-normal">
                  ({items.length})
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.slice(0, 3).map((landmark) => (
                  <div
                    key={landmark.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {landmark.name}
                      </p>
                      {landmark.rating && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#E8395A">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span>{landmark.rating.toFixed(1)}</span>
                          {landmark.totalRatings > 0 && (
                            <span className="text-gray-400">
                              ({landmark.totalRatings})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-2 px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600">
                      {formatDistance(landmark.distanceKm)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
