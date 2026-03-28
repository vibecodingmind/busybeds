export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailRenewalReminder } from '@/lib/email';

async function authCheck(req: NextRequest): Promise<boolean> {
  const session = await getSessionFromRequest(req);
  if (session?.role === 'admin') return true;
  const cronHeader = req.headers.get('X-Cron-Secret');
  const authHeader = req.headers.get('Authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (cronHeader === secret) return true;
  if (authHeader === `Bearer ${secret}`) return true;
  return false;
}

// GET — called by Vercel Cron
export async function GET(req: NextRequest) {
  if (!await authCheck(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return runReminders();
}

// POST — called manually by admin
export async function POST(req: NextRequest) {
  if (!await authCheck(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return runReminders();
}

async function runReminders(): Promise<NextResponse> {
  try {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find subscriptions expiring within 3 days
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: {
          gte: now,
          lte: in3Days,
        },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        package: {
          select: { name: true },
        },
      },
    });

    const sent: string[] = [];
    const failed: string[] = [];

    for (const sub of subscriptions) {
      try {
        const daysLeft = Math.ceil((sub.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        await sendEmail({
          to: sub.user.email,
          subject: `Your Busy Beds subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
          html: emailRenewalReminder(
            sub.user.fullName,
            sub.package.name,
            sub.expiresAt,
            `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`
          ),
        });
        
        sent.push(sub.id);
      } catch (error) {
        console.error(`Failed to send reminder for subscription ${sub.id}:`, error);
        failed.push(sub.id);
      }
    }

    return NextResponse.json({
      sent: sent.length,
      subscriptions: sent,
      failed: failed.length,
      failedIds: failed,
      message: `Sent ${sent.length} renewal reminders${failed.length > 0 ? ` (${failed.length} failed)` : ''}`,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders', details: String(error) },
      { status: 500 }
    );
  }
}
