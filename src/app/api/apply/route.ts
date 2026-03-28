export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  hotelName: z.string().min(2, 'Hotel name must be at least 2 characters'),
  hotelType: z.string().default('Hotel'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  starRating: z.coerce.number().int().min(1).max(5).default(3),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  discountPercent: z.coerce.number().int().min(5).max(50).default(15),
  notes: z.string().optional().or(z.literal('')),
});

function generateRefId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'BB-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function emailApplicantConfirmation(hotelName: string, contactName: string, refId: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="https://busybeds.com/logo.png" alt="BusyBeds" style="height:36px;" />
      </div>
      <h2 style="color:#1A3C5E;margin-bottom:8px;">Application Received! 🎉</h2>
      <p style="color:#555;margin-bottom:16px;">Hi ${contactName},</p>
      <p style="color:#555;margin-bottom:16px;">
        Thanks for applying to list <strong>${hotelName}</strong> on BusyBeds. We've received your application and our team will review it within <strong>24–48 hours</strong>.
      </p>
      <div style="background:#F7F8FA;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">Your reference number</p>
        <p style="color:#0E7C7B;font-size:18px;font-weight:700;font-family:monospace;margin:0;">${refId}</p>
      </div>
      <p style="color:#555;margin-bottom:16px;">
        Once approved, we'll set up your hotel listing and owner account. You'll be able to manage everything from your owner dashboard.
      </p>
      <p style="color:#555;margin-bottom:24px;">
        If you have any questions in the meantime, feel free to reply to this email.
      </p>
      <p style="color:#888;font-size:13px;">— The BusyBeds Team</p>
    </div>
  `;
}

function emailAdminNewApplication(data: {
  hotelName: string;
  hotelType: string;
  city: string;
  country: string;
  starRating: number;
  websiteUrl?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  whatsapp?: string;
  discountPercent: number;
  notes?: string;
  refId: string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      <h2 style="color:#1A3C5E;margin-bottom:8px;">New Partner Application</h2>
      <p style="color:#888;font-size:12px;margin-bottom:24px;">Ref: ${data.refId}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${[
          ['Hotel Name', data.hotelName],
          ['Type', data.hotelType],
          ['Location', `${data.city}, ${data.country}`],
          ['Stars', `${data.starRating} ★`],
          ['Website', data.websiteUrl || '—'],
          ['Discount Offered', `${data.discountPercent}%`],
          ['Contact Name', data.contactName],
          ['Contact Email', data.contactEmail],
          ['Phone', data.contactPhone || '—'],
          ['WhatsApp', data.whatsapp || '—'],
          ['Notes', data.notes || '—'],
        ].map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#888;width:160px;vertical-align:top;">${k}</td>
            <td style="padding:8px 0;color:#1A3C5E;font-weight:600;">${v}</td>
          </tr>
        `).join('')}
      </table>
      <div style="margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://busybeds.com'}/admin/hotels"
          style="background:#1A3C5E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
          Review in Admin Panel
        </a>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const refId = generateRefId();

    // Save the application as a HotelSuggestion with extended notes
    const notesPayload = [
      `[PARTNER APPLICATION] Ref: ${refId}`,
      `Contact: ${data.contactName} | ${data.contactEmail}`,
      data.contactPhone ? `Phone: ${data.contactPhone}` : null,
      data.whatsapp ? `WhatsApp: ${data.whatsapp}` : null,
      `Hotel Type: ${data.hotelType} | Stars: ${data.starRating}`,
      `Discount Offered: ${data.discountPercent}%`,
      data.notes ? `Notes: ${data.notes}` : null,
    ].filter(Boolean).join('\n');

    await prisma.hotelSuggestion.create({
      data: {
        hotelName: data.hotelName,
        hotelCity: data.city,
        hotelCountry: data.country,
        hotelWebsite: data.websiteUrl || null,
        notes: notesPayload,
        suggestedByEmail: data.contactEmail,
        status: 'pending',
      },
    });

    // Send confirmation to applicant
    sendEmail({
      to: data.contactEmail,
      subject: `Your BusyBeds Partner Application — ${data.hotelName}`,
      html: emailApplicantConfirmation(data.hotelName, data.contactName, refId),
    }).catch(e => console.error('[Apply] Applicant email error:', e));

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `[BusyBeds] New Partner Application: ${data.hotelName} (${data.city}, ${data.country})`,
        html: emailAdminNewApplication({ ...data, refId }),
      }).catch(e => console.error('[Apply] Admin email error:', e));
    }

    return NextResponse.json({ success: true, refId }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    console.error('[Apply] Error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
