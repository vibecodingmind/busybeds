export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  hotelId: z.string(),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().int().min(1).max(20).optional(),
  message: z.string().min(10).max(1000),
});

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`inquiry:${ip}`, { limit: 5, windowSec: 3600 }); // 5 per hour
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many inquiries. Please wait before sending another.' }, { status: 429 });
  }

  const session = await getSessionFromRequest(req);
  const body = await req.json();
  const data = schema.parse(body);

  const hotel = await prisma.hotel.findUnique({
    where: { id: data.hotelId },
    select: { name: true, email: true, whatsapp: true, owner: { include: { user: { select: { email: true, fullName: true } } } } },
  });

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  // Determine recipient email
  const recipientEmail = hotel.email || hotel.owner?.user?.email;

  if (recipientEmail) {
    const checkInOut = data.checkIn && data.checkOut
      ? `<li><strong>Dates:</strong> ${data.checkIn} → ${data.checkOut}</li>`
      : '';
    const guestsLine = data.guests ? `<li><strong>Guests:</strong> ${data.guests}</li>` : '';
    const phoneLine = data.phone ? `<li><strong>Phone:</strong> ${data.phone}</li>` : '';

    await sendEmail({
      to: recipientEmail,
      subject: `📩 New inquiry for ${hotel.name} from ${data.name}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>
          body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0}
          .wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden}
          .header{background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff}
          .body{padding:28px 32px;color:#1D2939;line-height:1.6}
          .box{background:#F2F4F7;border-radius:10px;padding:16px 20px;margin:16px 0}
          .msg{background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:16px;white-space:pre-wrap;font-size:14px}
          .footer{padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee;text-align:center}
        </style></head><body>
        <div class="wrap">
          <div class="header"><h2 style="margin:0">📩 New Guest Inquiry</h2><p style="margin:4px 0 0;opacity:.75">${hotel.name}</p></div>
          <div class="body">
            <p>You have a new inquiry from a potential guest via BusyBeds.</p>
            <div class="box">
              <ul style="margin:0;padding-left:16px;list-style:none">
                <li style="margin-bottom:6px"><strong>👤 Name:</strong> ${data.name}</li>
                <li style="margin-bottom:6px"><strong>📧 Email:</strong> <a href="mailto:${data.email}" style="color:#0E7C7B">${data.email}</a></li>
                ${phoneLine}
                ${checkInOut}
                ${guestsLine}
              </ul>
            </div>
            <p><strong>Message:</strong></p>
            <div class="msg">${data.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <p style="margin-top:20px;font-size:13px;color:#888">Reply directly to <strong>${data.email}</strong> to respond to this inquiry.</p>
          </div>
          <div class="footer">© ${new Date().getFullYear()} BusyBeds · Sent on behalf of ${data.name}</div>
        </div></body></html>
      `,
    });
  }

  // Also send WhatsApp if hotel has it and no email
  if (!recipientEmail && hotel.whatsapp) {
    // Return whatsapp URL for client to open
    const msg = `Hi, I'm interested in staying at ${hotel.name}.\n\n${data.message}\n\nFrom: ${data.name} (${data.email})`;
    return NextResponse.json({ ok: true, whatsapp: `https://wa.me/${hotel.whatsapp}?text=${encodeURIComponent(msg)}` });
  }

  return NextResponse.json({ ok: true, emailSent: !!recipientEmail });
}
