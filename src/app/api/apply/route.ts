export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const schema = z.object({
  hotelId: z.string(),
  documents: z.string().optional(), // JSON array of document descriptions/names
  notes: z.string().optional(),
});

// POST /api/apply — hotel owner submits KYC
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'hotel_owner') return NextResponse.json({ error: 'Only hotel owners can apply' }, { status: 403 });

  const body = await req.json();
  const { hotelId, documents, notes } = schema.parse(body);

  // Check hotel exists and is not already claimed
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const existingOwner = await prisma.hotelOwner.findUnique({ where: { hotelId } });
  if (existingOwner && existingOwner.userId !== session.userId) {
    return NextResponse.json({ error: 'This hotel already has an owner application' }, { status: 409 });
  }

  // Upsert the application
  const application = await prisma.hotelOwner.upsert({
    where: { userId: session.userId },
    update: { hotelId, kycStatus: 'pending', kycDocuments: documents, kycSubmittedAt: new Date(), kycReviewedAt: null, kycRejectionReason: null },
    create: { userId: session.userId, hotelId, kycDocuments: documents, kycStatus: 'pending' },
  });

  return NextResponse.json({ application }, { status: 201 });
}

// GET /api/apply — hotel owner checks their application status
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const application = await prisma.hotelOwner.findUnique({
    where: { userId: session.userId },
    include: { hotel: { select: { name: true, city: true, country: true, slug: true } } },
  });

  return NextResponse.json({ application });
}
