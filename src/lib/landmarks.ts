/**
 * Landmark utilities for fetching nearby points of interest
 */

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

// Landmark types to fetch (popular/useful for travelers)
export const LANDMARK_TYPES = [
  { type: 'supermarket', typeName: 'Supermarket', icon: '🛒' },
  { type: 'shopping_mall', typeName: 'Shopping Mall', icon: '🛍️' },
  { type: 'grocery_or_supermarket', typeName: 'Grocery Store', icon: '🏪' },
  { type: 'park', typeName: 'Park', icon: '🌳' },
  { type: 'hospital', typeName: 'Hospital', icon: '🏥' },
  { type: 'pharmacy', typeName: 'Pharmacy', icon: '💊' },
  { type: 'atm', typeName: 'ATM', icon: '🏧' },
  { type: 'bank', typeName: 'Bank', icon: '🏦' },
  { type: 'restaurant', typeName: 'Restaurant', icon: '🍽️' },
  { type: 'cafe', typeName: 'Cafe', icon: '☕' },
  { type: 'gas_station', typeName: 'Gas Station', icon: '⛽' },
  { type: 'tourist_attraction', typeName: 'Tourist Attraction', icon: ' landmarks' },
  { type: 'museum', typeName: 'Museum', icon: '🏛️' },
  { type: 'transit_station', typeName: 'Transit Station', icon: '🚉' },
  { type: 'airport', typeName: 'Airport', icon: '✈️' },
] as const;

export type LandmarkType = typeof LANDMARK_TYPES[number]['type'];

export interface LandmarkData {
  googlePlaceId: string;
  name: string;
  type: string;
  typeName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  rating: number | null;
  totalRatings: number;
  photoUrl: string | null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Fetch nearby landmarks for a hotel location
 */
export async function fetchNearbyLandmarks(
  latitude: number,
  longitude: number,
  apiKey: string,
  maxDistance: number = 5, // 5km default radius
  minRatings: number = 10, // Minimum ratings to be considered "popular"
  maxPerType: number = 3, // Max 3 landmarks per type
): Promise<LandmarkData[]> {
  const landmarks: LandmarkData[] = [];

  // Fetch each type separately to get better results
  for (const { type, typeName } of LANDMARK_TYPES) {
    try {
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: (maxDistance * 1000).toString(), // Convert km to meters
        type,
        key: apiKey,
      });

      const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`);
      const data = await res.json();

      if (data.status !== 'OK' || !data.results?.length) {
        continue;
      }

      // Sort by rating + total ratings (popularity score)
      const sorted = data.results
        .filter((r: { user_ratings_total?: number }) => 
          (r.user_ratings_total || 0) >= minRatings
        )
        .sort((a: { rating?: number; user_ratings_total?: number }, b: { rating?: number; user_ratings_total?: number }) => {
          const scoreA = (a.rating || 0) * 10 + Math.min((a.user_ratings_total || 0) / 100, 5);
          const scoreB = (b.rating || 0) * 10 + Math.min((b.user_ratings_total || 0) / 100, 5);
          return scoreB - scoreA;
        })
        .slice(0, maxPerType);

      for (const place of sorted) {
        const placeLat = place.geometry?.location?.lat;
        const placeLng = place.geometry?.location?.lng;

        if (!placeLat || !placeLng) continue;

        const distanceKm = calculateDistance(latitude, longitude, placeLat, placeLng);

        // Double-check distance
        if (distanceKm > maxDistance) continue;

        // Get photo URL if available
        let photoUrl: string | null = null;
        if (place.photos?.[0]?.photo_reference) {
          photoUrl = `${PLACES_BASE}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`;
        }

        landmarks.push({
          googlePlaceId: place.place_id,
          name: place.name,
          type,
          typeName,
          address: place.vicinity || place.formatted_address || null,
          latitude: placeLat,
          longitude: placeLng,
          distanceKm,
          rating: place.rating || null,
          totalRatings: place.user_ratings_total || 0,
          photoUrl,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`[Landmarks] Error fetching ${type}:`, error);
    }
  }

  // Sort all landmarks by distance
  return landmarks.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Get icon for landmark type
 */
export function getLandmarkIcon(type: string): string {
  const found = LANDMARK_TYPES.find(l => l.type === type);
  return found?.icon || '📍';
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km}km`;
}

/**
 * Popular African destinations for the selector
 */
export const AFRICAN_DESTINATIONS = {
  Tanzania: {
    icon: '🇹🇿',
    regions: {
      'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni'],
      'Arusha': ['Arusha City', 'Arusha Rural'],
      'Zanzibar': ['Stone Town', 'Nungwi', 'Kendwa', 'Paje', 'Jambiani'],
      'Mwanza': ['Mwanza City', 'Nyamagana', 'Ilemela'],
      'Dodoma': ['Dodoma City', 'Kondoa', 'Mpwapwa'],
      'Morogoro': ['Morogoro Urban', 'Morogoro Rural', 'Mvomero'],
      'Mbeya': ['Mbeya City', 'Rungwe', 'Kyela'],
      'Kilimanjaro': ['Moshi Urban', 'Moshi Rural', 'Hai', 'Rombo'],
      'Serengeti': ['Seronera', 'Lobo', 'Ndutu'],
      'Ngorongoro': ['Karatu', 'Ngorongoro Crater'],
    }
  },
  Kenya: {
    icon: '🇰🇪',
    regions: {
      'Nairobi': ['Westlands', 'Karen', 'Kilimani', 'Kileleshwa', 'Lavington'],
      'Mombasa': ['Nyali', 'Bamburi', 'Diani', 'Malindi', 'Watamu'],
      'Kisumu': ['Kisumu City', 'Dunga'],
      'Nakuru': ['Nakuru Town', 'Naivasha', 'Elementaita'],
      'Maasai Mara': ['Keekorok', 'Talek', 'Musabi'],
      'Amboseli': ['Amboseli National Park'],
    }
  },
  Uganda: {
    icon: '🇺🇬',
    regions: {
      'Kampala': ['Central Kampala', 'Kololo', 'Nakasero', 'Bugolobi'],
      'Entebbe': ['Entebbe Town', 'Kitala'],
      'Jinja': ['Jinja Town', 'Source of Nile'],
    }
  },
  Rwanda: {
    icon: '🇷🇼',
    regions: {
      'Kigali': ['Nyarutarama', 'Kacyiru', 'Remera', 'Kimihurura'],
      'Musanze': ['Ruhengeri', 'Volcanoes National Park'],
    }
  },
  'South Africa': {
    icon: '🇿🇦',
    regions: {
      'Cape Town': ['City Bowl', 'V&A Waterfront', 'Clifton', 'Camps Bay'],
      'Johannesburg': ['Sandton', 'Rosebank', 'Melrose'],
      'Durban': ['Umhlanga', 'Ballito', 'Durban North'],
      'Kruger': ['Skukuza', 'Lower Sabie', 'Satara'],
    }
  },
  Ethiopia: {
    icon: '🇪🇹',
    regions: {
      'Addis Ababa': ['Bole', 'Kazanchis', 'Piazza'],
    }
  },
  Ghana: {
    icon: '🇬🇭',
    regions: {
      'Accra': ['Osustu', 'Cantonments', 'Airport Residential', 'East Legon'],
      'Kumasi': ['Adum', 'Bantama'],
    }
  },
  Nigeria: {
    icon: '🇳🇬',
    regions: {
      'Lagos': ['Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja'],
      'Abuja': ['Maitama', 'Wuse', 'Asokoro'],
    }
  },
  Morocco: {
    icon: '🇲🇦',
    regions: {
      'Marrakech': ['Medina', 'Gueliz', 'Hivernage'],
      'Casablanca': ['City Center', 'Corniche'],
      'Fes': ['Fes el Bali', 'Fes el Jdid'],
    }
  },
  Egypt: {
    icon: '🇪🇬',
    regions: {
      'Cairo': ['Downtown', 'Zamalek', 'Maadi', 'Heliopolis'],
      'Alexandria': ['Corniche', 'Stanley'],
      'Sharm El Sheikh': ['Naama Bay', 'Shark Bay'],
      'Hurghada': ['Sakkala', 'Village Road'],
    }
  },
} as const;

export type Country = keyof typeof AFRICAN_DESTINATIONS;
