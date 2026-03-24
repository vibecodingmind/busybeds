export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city        = searchParams.get('city');
  const country     = searchParams.get('country');
  const search      = searchParams.get('search');
  const featured    = searchParams.get('featured');
  const stars       = searchParams.get('stars');        // "3" | "4" | "5"
  const minDiscount = searchParams.get('minDiscount');  // "10"
  const amenities   = searchParams.get('amenities');    // "wifi,pool"
  const sortBy      = searchParams.get('sort');         // "discount" | "rating" | "newest"

  const where: Record<string, any> = { status: 'active' };

  if (city)    where.city    = { contains: city,    mode: 'insensitive' };
  if (country) where.country = { contains: country, mode: 'insensitive' };
  if (featured === 'true') where.isFeatured = true;
  if (stars) {
    const starNums = stars.split(',').map(Number).filter(n => n >= 1 && n <= 5);
    if (starNums.length) where.starRating = { in: starNums };
  }
  if (minDiscount) {
    const d = parseInt(minDiscount);
    if (!isNaN(d)) where.discountPercent = { gte: d };
  }
  if (search) {
    where.OR = [
      { name:    { contains: search, mode: 'insensitive' } },
      { city:    { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
      { descriptionShort: { contains: search, mode: 'insensitive' } },
    ];
  }

  const page  = parseInt(searchParams.get('page')  || '1');
  const limit = parseInt(searchParams.get('limit') || '18');
  const skip  = (page - 1) * limit;

  try {
    let hotels = await prisma.hotel.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        country: true,
        coverImage: true,
        discountPercent: true,
        starRating: true,
        avgRating: true,
        reviewCount: true,
        isFeatured: true,
        vibeTags: true,
        amenities: true,
        partnershipStatus: true,
        roomTypes: {
          orderBy: { displayOrder: 'asc' },
          select: { pricePerNight: true }
        },
        photos: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, url: true },
          take: 5
        },
        _count: { select: { coupons: true } },
      },
      orderBy: sortBy === 'discount' ? [{ discountPercent: 'desc' }]
             : sortBy === 'rating'   ? [{ avgRating: 'desc' }]
             : [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    });

    // Filter by amenities (JSON array stored as string)
    if (amenities) {
      const required = amenities.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
      if (required.length) {
        hotels = hotels.filter(h => {
          try {
            const arr: string[] = JSON.parse(h.amenities || '[]');
            return required.every(r => arr.some(a => a.toLowerCase().includes(r)));
          } catch { return false; }
        });
      }
    }

    return NextResponse.json({ hotels, total: hotels.length });
  } catch (err) {
    console.error('[GET /api/hotels]', err);
    return NextResponse.json({ hotels: [], total: 0 }, { status: 500 });
  }
}

const affiliateLinkSchema = z.object({
  platform: z.enum(['booking_com', 'airbnb', 'expedia', 'agoda', 'tripadvisor']),
  url: z.string().url(),
});

const createSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(1),
  country: z.string().min(1),
  address: z.string().optional().or(z.literal('')),
  category: z.string().default('Hotel'),
  descriptionShort: z.string().min(10),
  descriptionLong: z.string().min(20),
  starRating: z.number().int().min(1).max(5).default(3),
  amenities: z.array(z.string()).default([]),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  discountPercent: z.number().int().min(1).max(80).default(15),
  couponValidDays: z.number().int().min(1).max(365).default(30),
  coverImage: z.string().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  // Contact
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  // Social media
  socialFacebook:  z.string().optional().or(z.literal('')),
  socialInstagram: z.string().optional().or(z.literal('')),
  socialTwitter:   z.string().optional().or(z.literal('')),
  socialTiktok:    z.string().optional().or(z.literal('')),
  // GPS coordinates
  latitude:  z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  // Gallery photos (array of URLs)
  photos: z.array(z.string().url()).default([]),
  // Affiliate links
  affiliateLinks: z.array(affiliateLinkSchema).default([]),
  // Default room / price
  pricePerNight: z.number().min(0).optional(),
  roomName: z.string().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const { amenities, websiteUrl, photos, affiliateLinks, pricePerNight, roomName, latitude, longitude, ...rest } = data;

    // Create hotel
    const hotel = await prisma.hotel.create({
      data: {
        ...rest,
        slug,
        amenities: JSON.stringify(amenities),
        websiteUrl:       websiteUrl       || null,
        address:          rest.address      || null,
        email:            rest.email        || null,
        whatsapp:         rest.whatsapp     || null,
        socialFacebook:   rest.socialFacebook  || null,
        socialInstagram:  rest.socialInstagram || null,
        socialTwitter:    rest.socialTwitter   || null,
        socialTiktok:     rest.socialTiktok    || null,
        coverImage:       rest.coverImage   || undefined,
        latitude:         latitude  ?? null,
        longitude:        longitude ?? null,
      },
    });

    // Create gallery photos
    if (photos.length > 0) {
      await prisma.hotelPhoto.createMany({
        data: photos.map((url, i) => ({
          hotelId: hotel.id,
          url,
          isPrimary: i === 0,
          displayOrder: i,
        })),
      });
    }

    // Create affiliate links
    if (affiliateLinks.length > 0) {
      await prisma.affiliateLink.createMany({
        data: affiliateLinks.map(l => ({
          hotelId: hotel.id,
          platform: l.platform,
          url: l.url,
          isActive: true,
        })),
      });
    }

    // Create default room type if price provided
    if (pricePerNight && pricePerNight > 0) {
      await prisma.roomType.create({
        data: {
          hotelId: hotel.id,
          name: roomName?.trim() || 'Standard Room',
          description: 'Standard room',
          pricePerNight,
          maxOccupancy: 2,
          displayOrder: 0,
        },
      });
    }

    return NextResponse.json({ hotel }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
