'use client';

import { useState, useEffect } from 'react';

interface Landmark {
  id: string;
  name: string;
  type: string;
  typeName: string;
  address: string | null;
  distanceKm: number;
  rating: number | null;
  totalRatings: number;
  photoUrl: string | null;
}

interface LandmarksSectionProps {
  hotelId: string;
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
  tourist_attraction: '🎯',
  museum: '🏛️',
  transit_station: '🚉',
  airport: '✈️',
};

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km}km`;
}

export default function LandmarksSection({ hotelId }: LandmarksSectionProps) {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLandmarks() {
      try {
        const res = await fetch(`/api/hotels/${hotelId}/landmarks`);
        if (!res.ok) throw new Error('Failed to load landmarks');
        const data = await res.json();
        setLandmarks(data.landmarks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load landmarks');
      } finally {
        setLoading(false);
      }
    }
    fetchLandmarks();
  }, [hotelId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || landmarks.length === 0) {
    return null; // Don't show anything if no landmarks or error
  }

  // Group landmarks by type
  const groupedLandmarks = landmarks.reduce((acc, landmark) => {
    if (!acc[landmark.type]) {
      acc[landmark.type] = [];
    }
    acc[landmark.type].push(landmark);
    return acc;
  }, {} as Record<string, Landmark[]>);

  const types = Object.keys(groupedLandmarks);
  const filteredLandmarks = selectedType 
    ? groupedLandmarks[selectedType] || [] 
    : landmarks;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-xl">📍</span>
          What's Nearby
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Popular places within 5km
        </p>
      </div>

      {/* Type Filters */}
      <div className="px-6 py-3 border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedType === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({landmarks.length})
          </button>
          {types.map(type => {
            const icon = LANDMARK_ICONS[type] || '📍';
            const count = groupedLandmarks[type].length;
            const typeName = groupedLandmarks[type][0]?.typeName || type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedType === type
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{icon}</span>
                {typeName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Landmarks Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLandmarks.slice(0, 9).map(landmark => {
            const icon = LANDMARK_ICONS[landmark.type] || '📍';
            return (
              <div
                key={landmark.id}
                className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl flex-shrink-0">
                  {icon}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {landmark.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatDistance(landmark.distanceKm)} away
                    </span>
                    {landmark.rating && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FBBF24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          {landmark.rating.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                  {landmark.totalRatings > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {landmark.totalRatings.toLocaleString()} reviews
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more */}
        {filteredLandmarks.length > 9 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            +{filteredLandmarks.length - 9} more nearby places
          </p>
        )}
      </div>
    </div>
  );
}
