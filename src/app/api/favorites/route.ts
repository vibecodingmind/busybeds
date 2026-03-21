import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.userId },
      select: { hotelId: true },
    });

    const favoriteIds = favorites.map(f => f.hotelId);
    return NextResponse.json({ favoriteIds });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { hotelId } = body;

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID required' }, { status: 400 });
    }

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Check if favorite already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_hotelId: {
          userId: session.userId,
          hotelId,
        },
      },
    });

    let favorited = true;

    if (existing) {
      // Delete if exists (toggle off)
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      favorited = false;
    } else {
      // Create if doesn't exist (toggle on)
      await prisma.favorite.create({
        data: {
          userId: session.userId,
          hotelId,
        },
      });
      favorited = true;
    }

    return NextResponse.json({ favorited });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
