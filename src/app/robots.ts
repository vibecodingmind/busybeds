import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/portal/', '/api/', '/dashboard/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
