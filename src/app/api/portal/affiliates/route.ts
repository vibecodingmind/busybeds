import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { z } from 'zod';

// Valid affiliate platforms
const VALID_PLATFORMS = [
  'booking_com',
  'airbnb',
  'expedia',
  'agoda',
  'tripadvisor',
] as const;

// Zod schema for POST request
const createAffiliateSchema = z.object({
  platform: z.enum(VALID_PLATFORMS),
  url: z.string().url('Invalid URL'),
});

type CreateAffiliateInput = z.infer<typeof createAffiliateSchema>;

/**
 * Helper function to get the hotel for the logged-in user
 */
async function getHotelForUser(
  session: any,
  queryHotelId?: string
): Promise<any | null> {
  if (session.role === 'admin' && queryHotelId) {
    // Admin can specify hotelId via query params
    const hotel = await prisma.hotel.findUnique({
      where: { id: queryHotelId },
    });
    return hotel;
  }

  if (session.role === 'hotel_owner') {
    // Find via HotelOwner table
    const hotelOwner = await prisma.hotelOwner.findUnique({
      where: { userId: session.userId },
      include: { hotel: true },
    });
    return hotelOwner?.hotel || null;
  }

  if (session.role === 'hotel_manager') {
    // Find via HotelManager table
    const hotelManager = await prisma.hotelManager.findUnique({
      where: { userId: session.userId },
      include: { hotel: true },
    });
    return hotelManager?.hotel || null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to a hotel
    const hotel = await getHotelForUser(session);

    if (!hotel) {
      return NextResponse.json(
        { error: 'No hotel associated with this user' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createAffiliateSchema.parse(body);

    // Upsert affiliate link (findFirst + update or create)
    const existing = await prisma.affiliateLink.findFirst({
      where: { hotelId: hotel.id, platform: validatedData.platform },
    });
    const affiliateLink = existing
      ? await prisma.affiliateLink.update({
          where: { id: existing.id },
          data: { url: validatedData.url, updatedAt: new Date() },
        })
      : await prisma.affiliateLink.create({
          data: { hotelId: hotel.id, platform: validatedData.platform, url: validatedData.url },
        });

    return NextResponse.json({ affiliateLink });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Affiliate POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Auth check
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to a hotel
    const hotel = await getHotelForUser(session);

    if (!hotel) {
      return NextResponse.json(
        { error: 'No hotel associated with this user' },
        { status: 403 }
      );
    }

    // Get linkId from request body or query params
    let linkId: string | null = null;

    const { searchParams } = new URL(req.url);
    linkId = searchParams.get('linkId');

    if (!linkId) {
      try {
        const body = await req.json();
        linkId = body.linkId;
      } catch {
        // Body parsing failed, linkId might be in query params
      }
    }

    if (!linkId) {
      return NextResponse.json(
        { error: 'linkId is required' },
        { status: 400 }
      );
    }

    // Verify the link belongs to the user's hotel
    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { id: linkId },
    });

    if (!affiliateLink || affiliateLink.hotelId !== hotel.id) {
      return NextResponse.json(
        { error: 'Affiliate link not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the link
    await prisma.affiliateLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Affiliate DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
