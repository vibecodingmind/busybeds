import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/hotels/', '/subscribe'],
        disallow: ['/admin/', '/portal/', '/api/', '/apply/status'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
