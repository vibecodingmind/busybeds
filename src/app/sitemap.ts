import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/hotels`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/coupons`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/apply`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Add /locations
  staticPages.push({ url: `${baseUrl}/locations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 });

  try {
    const hotels = await prisma.hotel.findMany({
      where: { status: 'active' },
      select: { slug: true, city: true, country: true, updatedAt: true },
    });

    const hotelPages: MetadataRoute.Sitemap = hotels.map(hotel => ({
      url: `${baseUrl}/hotels/${hotel.slug}`,
      lastModified: hotel.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Unique country pages
    const countrySet = new Set(hotels.map(h => h.country));
    const countries = Array.from(countrySet);
    const countryPages: MetadataRoute.Sitemap = countries.map(c => ({
      url: `${baseUrl}/locations/${nameToSlug(c)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));

    // Unique city pages
    const cityKeySet = new Set(hotels.map(h => `${h.country}::${h.city}`));
    const cityKeys = Array.from(cityKeySet);
    const cityPages: MetadataRoute.Sitemap = cityKeys.map(key => {
      const [country, city] = key.split('::');
      return {
        url: `${baseUrl}/locations/${nameToSlug(country)}/${nameToSlug(city)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    return [...staticPages, ...countryPages, ...cityPages, ...hotelPages];
  } catch {
    return staticPages;
  }
}
