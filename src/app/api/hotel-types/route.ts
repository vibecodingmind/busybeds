export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const types = await prisma.hotelType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ types });
  } catch (error) {
    console.error('Error fetching hotel types:', error);
    return NextResponse.json({ error: 'Failed to fetch hotel types' }, { status: 500 });
  }
}
