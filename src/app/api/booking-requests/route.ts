export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  hotelId: z.string(),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().int().min(1).max(30).default(1),
  roomTypeId: z.string().optional(),
  message: z.string().min(5).max(1000),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const d = parsed.data;

  const hotel = await prisma.hotel.findUnique({
    where: { id: d.hotelId },
    select: {
      name: true, email: true, slug: true, allowBookingRequests: true,
      owner: { include: { user: { select: { email: true, fullName: true } } } },
    },
  });
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
  if (!hotel.allowBookingRequests) {
    return NextResponse.json({ error: 'This hotel does not accept direct booking requests.' }, { status: 403 });
  }

  const request = await prisma.bookingRequest.create({
    data: {
      hotelId: d.hotelId,
      userId: session?.userId ?? null,
      name: d.name,
      email: d.email,
      phone: d.phone ?? null,
      checkIn: d.checkIn ? new Date(d.checkIn) : null,
      checkOut: d.checkOut ? new Date(d.checkOut) : null,
      guests: d.guests,
      roomTypeId: d.roomTypeId ?? null,
      message: d.message,
    },
  });

  // Notify hotel owner
  const recipientEmail = hotel.email || hotel.owner?.user?.email;
  if (recipientEmail) {
    const checkInfo = d.checkIn && d.checkOut
      ? `Check-in: ${d.checkIn} → Check-out: ${d.checkOut} (${d.guests} guest${d.guests > 1 ? 's' : ''})` : '';
    await sendEmail({
      to: recipientEmail,
      subject: `🏨 New Booking Request for ${hotel.name} from ${d.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
          <div style="background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff">
            <h2 style="margin:0">🏨 New Booking Request</h2>
            <p style="margin:4px 0 0;opacity:.75">${hotel.name}</p>
          </div>
          <div style="padding:28px 32px;color:#1D2939;line-height:1.6">
            <p>You have a new booking request via <strong>BusyBeds</strong>.</p>
            <div style="background:#F2F4F7;border-radius:10px;padding:16px 20px;margin:16px 0">
              <p style="margin:0 0 8px"><strong>👤 Guest:</strong> ${d.name}</p>
              <p style="margin:0 0 8px"><strong>📧 Email:</strong> <a href="mailto:${d.email}" style="color:#0E7C7B">${d.email}</a></p>
              ${d.phone ? `<p style="margin:0 0 8px"><strong>📞 Phone:</strong> ${d.phone}</p>` : ''}
              ${checkInfo ? `<p style="margin:0 0 8px"><strong>📅 ${checkInfo}</strong></p>` : ''}
            </div>
            <p><strong>Message:</strong></p>
            <div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:16px;white-space:pre-wrap;font-size:14px">${d.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <p style="margin-top:20px;font-size:13px;color:#888">Reply to <a href="mailto:${d.email}">${d.email}</a> to respond.</p>
          </div>
        </div>
      `,
    });
  }

  // Confirm to guest
  await sendEmail({
    to: d.email,
    subject: `✅ Booking request received — ${hotel.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
        <div style="background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff">
          <h2 style="margin:0">✅ Request Received!</h2>
          <p style="margin:4px 0 0;opacity:.75">BusyBeds</p>
        </div>
        <div style="padding:28px 32px;color:#1D2939;line-height:1.6">
          <p>Hi ${d.name},</p>
          <p>Your booking request for <strong>${hotel.name}</strong> has been received. The hotel will contact you shortly at <strong>${d.email}</strong>.</p>
          ${d.checkIn ? `<p>📅 Requested dates: <strong>${d.checkIn} → ${d.checkOut}</strong></p>` : ''}
          <p style="font-size:13px;color:#888;margin-top:24px">If you have questions, visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/hotels/${hotel.slug}" style="color:#0E7C7B">${hotel.name} on BusyBeds</a>.</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, requestId: request.id });
}

// GET /api/booking-requests  — user's own requests
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await prisma.bookingRequest.findMany({
    where: { userId: session.userId },
    include: { hotel: { select: { name: true, slug: true, coverImage: true, city: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ requests });
}
