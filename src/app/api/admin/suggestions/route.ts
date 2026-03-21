import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const suggestions = await prisma.hotelSuggestion.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        hotelName: true,
        hotelCity: true,
        hotelCountry: true,
        hotelWebsite: true,
        notes: true,
        suggestedByUserId: true,
        suggestedByEmail: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { suggestionId, action, createHotel } = body;

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get suggestion first
    const suggestion = await prisma.hotelSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // If accepting and createHotel is true, create the hotel
    let newHotel = null;
    if (action === 'accept' && createHotel) {
      // Generate slug from hotel name (simple slugification)
      const slug = suggestion.hotelName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);

      // Make slug unique by checking for existing hotels
      let finalSlug = slug;
      let counter = 1;
      while (await prisma.hotel.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter++}`;
      }

      newHotel = await prisma.hotel.create({
        data: {
          name: suggestion.hotelName,
          slug: finalSlug,
          city: suggestion.hotelCity,
          country: suggestion.hotelCountry,
          descriptionShort: `${suggestion.hotelName} in ${suggestion.hotelCity}`,
          descriptionLong: suggestion.notes || `Welcome to ${suggestion.hotelName}`,
          websiteUrl: suggestion.hotelWebsite || undefined,
          status: 'active',
          category: 'Hotel',
        },
      });

      console.log(`[Suggestions] Created hotel from suggestion: ${newHotel.id}`);
    }

    // Update suggestion status
    const updatedSuggestion = await prisma.hotelSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: action === 'accept' ? 'accepted' : 'rejected',
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      suggestion: updatedSuggestion,
      hotel: newHotel,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }
    console.error('[Suggestions] Error processing suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to process suggestion' },
      { status: 500 }
    );
  }
}
