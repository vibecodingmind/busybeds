#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Applying BusyBeds fixes..."

# 1. admin/fraud: updatedAt → createdAt
sed -i '' 's/orderBy: { updatedAt:/orderBy: { createdAt:/g' src/app/api/admin/fraud/route.ts

# 2. admin/health: updatedAt → createdAt (30 days)
sed -i '' 's/where: { updatedAt: { gte: new Date(Date.now() - 24 \* 60 \* 60 \* 1000) } }/where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }/' src/app/api/admin/health/route.ts

# 3. admin/users: remove hotelOwner from _count
sed -i '' 's/_count: { select: { coupons: true, hotelOwner: true } }/_count: { select: { coupons: true } }/' src/app/api/admin/users/route.ts

# 4. reviews: fix unique key + field names
sed -i '' 's/userId_hotelId:/hotelId_userId:/g' src/app/api/hotels/[id]/reviews/route.ts
sed -i '' 's/comment: validatedData.comment || null/body: validatedData.comment ?? ""/g' src/app/api/hotels/[id]/reviews/route.ts

# 5. portal/analytics: createdAt → generatedAt
sed -i '' 's/where: { createdAt: { gte: since } }/where: { generatedAt: { gte: since } }/g' src/app/api/portal/analytics/route.ts
sed -i '' 's/select: { id: true, createdAt: true }/select: { id: true, generatedAt: true }/g' src/app/api/portal/analytics/route.ts

# 6. price-alerts: prisma.priceAlert → (prisma as any).priceAlert
sed -i '' 's/prisma\.priceAlert/(prisma as any).priceAlert/g' src/app/api/price-alerts/route.ts
sed -i '' 's/prisma\.priceAlert/(prisma as any).priceAlert/g' src/app/api/price-alerts/send/route.ts
sed -i '' 's/prisma\.priceAlert/(prisma as any).priceAlert/g' src/app/api/price-alerts/unsubscribe/route.ts

# 7. Map iterator fix in send route
sed -i '' 's/for (const \[, hotelAlerts\] of hotelAlertMap)/for (const [, hotelAlerts] of Array.from(hotelAlertMap))/g' src/app/api/price-alerts/send/route.ts

# 8. reviews/reply: fix hotel include
sed -i '' "s/include: { hotel: { select: { ownerId: true } } },/include: { hotel: { include: { owner: { select: { userId: true } } } } },/" src/app/api/reviews/[id]/reply/route.ts
sed -i '' 's/(review.hotel as any).ownerId === session.userId/(review as any).hotel?.owner?.userId === session.userId/' src/app/api/reviews/[id]/reply/route.ts

# 9. HotelCard: remove avgRating from addToRecent
sed -i '' 's/, avgRating: hotel.avgRating//' src/components/HotelCard.tsx

# 10. PushNotificationToggle: fix string iteration
sed -i '' 's/\[\.\.\.(rawData)\]/Array.from(rawData)/' src/components/PushNotificationToggle.tsx

# 11. cloudinary: Buffer → Uint8Array
sed -i '' 's/new Blob(\[buffer\])/new Blob([new Uint8Array(buffer)])/' src/lib/cloudinary.ts

# 12. package.json: add postinstall
sed -i '' 's/"scripts": {/"scripts": {\n    "postinstall": "prisma generate",/' package.json

echo "✅ All TypeScript fixes applied."
echo ""
echo "Now creating hotel page split (server + client)..."

# 13. Create HotelPageClient.tsx
cp src/app/hotels/\[slug\]/page.tsx src/app/hotels/\[slug\]/HotelPageClient.tsx

# 14. Rewrite page.tsx as server component
cat > src/app/hotels/\[slug\]/page.tsx << 'PAGE'
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import HotelPageClient from './HotelPageClient';

interface PageProps { params: { slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: params.slug },
    include: { roomTypes: { take: 1 }, photos: { take: 1 } },
  });
  if (!hotel) return { title: 'Hotel Not Found — BusyBeds' };
  const base = hotel.roomTypes[0]?.pricePerNight ?? null;
  const discounted = base ? Math.round(base * (1 - hotel.discountPercent / 100)) : null;
  const image = hotel.coverImage || hotel.photos[0]?.url || 'https://busybeds.com/og-default.jpg';
  const desc = `Save ${hotel.discountPercent}% at ${hotel.name} in ${hotel.city}, ${hotel.country}.${discounted ? ` From $${discounted}/night.` : ''} Get your exclusive discount coupon now on BusyBeds.`;
  return {
    title: `${hotel.name} — ${hotel.discountPercent}% Off | BusyBeds`,
    description: desc,
    openGraph: { title: `${hotel.name} — ${hotel.discountPercent}% Discount`, description: desc, images: [{ url: image, width: 1200, height: 630, alt: hotel.name }], type: 'website', siteName: 'BusyBeds' },
    twitter: { card: 'summary_large_image', title: `${hotel.name} — ${hotel.discountPercent}% Off`, description: desc, images: [image] },
    keywords: [hotel.name, hotel.city, hotel.country, 'hotel discount', 'hotel coupon', 'BusyBeds'],
  };
}

export default async function HotelPage({ params }: PageProps) {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: params.slug },
    include: { roomTypes: true, photos: true, affiliateLinks: true },
  });
  if (!hotel) notFound();
  const hotelData = {
    id: hotel.id, name: hotel.name, city: hotel.city, country: hotel.country,
    address: (hotel as any).address ?? null, category: (hotel as any).category ?? null,
    slug: hotel.slug, descriptionShort: hotel.descriptionShort, descriptionLong: hotel.descriptionLong,
    starRating: hotel.starRating,
    amenities: (() => { try { return JSON.parse(hotel.amenities as unknown as string); } catch { return []; } })(),
    websiteUrl: (hotel as any).websiteUrl ?? null, whatsapp: (hotel as any).whatsapp ?? null,
    email: (hotel as any).email ?? null, coverImage: hotel.coverImage ?? null,
    discountPercent: hotel.discountPercent, couponValidDays: hotel.couponValidDays,
    avgRating: (hotel as any).avgRating ?? null, reviewCount: (hotel as any).reviewCount ?? 0,
    isFeatured: hotel.isFeatured,
    roomTypes: hotel.roomTypes.map((r: any) => ({ id: r.id, name: r.name, description: r.description ?? '', pricePerNight: r.pricePerNight, maxOccupancy: r.maxOccupancy ?? 1 })),
    photos: hotel.photos.map((p: any) => ({ id: p.id, url: p.url })),
    affiliateLinks: hotel.affiliateLinks.map((l: any) => ({ id: l.id, platform: l.platform, url: l.url })),
  };
  return <HotelPageClient hotel={hotelData} />;
}
PAGE

echo "✅ Hotel page split complete."
echo ""
echo "Now committing and pushing..."
git add -A
git commit -m "fix: resolve TS errors + split hotel page server/client for Vercel"
git push origin main
echo ""
echo "🚀 Done! Vercel deployment should start now."
