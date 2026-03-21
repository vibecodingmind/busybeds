import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

  const hotels = await prisma.hotel.findMany({
    where: { status: 'active' },
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/subscribe`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/apply`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const hotelPages: MetadataRoute.Sitemap = hotels.map(h => ({
    url: `${base}/hotels/${h.slug}`,
    lastModified: h.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...hotelPages];
}
