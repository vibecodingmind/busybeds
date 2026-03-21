export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailHotelSuggestionReceived } from '@/lib/email';

const schema = z.object({
  hotelName: z.string().min(2),
  hotelCity: z.string().min(1),
  hotelCountry: z.string().min(1),
  hotelWebsite: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const body = await req.json();

  try {
    const data = schema.parse(body);

    const suggestion = await prisma.hotelSuggestion.create({
      data: {
        hotelName: data.hotelName,
        hotelCity: data.hotelCity,
        hotelCountry: data.hotelCountry,
        hotelWebsite: data.hotelWebsite || null,
        notes: data.notes || null,
        suggestedByUserId: session?.userId || null,
        suggestedByEmail: data.email || null,
      },
    });

    // Notify the suggester
    const toEmail = data.email || (session ? await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } }).then(u => u?.email) : null);
    if (toEmail) {
      sendEmail({
        to: toEmail,
        subject: `Thanks for suggesting ${data.hotelName} — Busy Beds`,
        html: emailHotelSuggestionReceived(data.hotelName),
      }).catch(e => console.error('Email error:', e));
    }

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
