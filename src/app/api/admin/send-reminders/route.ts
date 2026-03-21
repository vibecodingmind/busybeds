import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail, emailRenewalReminder } from '@/lib/email';

export async function POST(req: NextRequest) {
  // Check for admin session or cron secret key
  const session = await getSessionFromRequest(req);
  const cronSecret = req.headers.get('X-Cron-Secret');
  
  const isAdmin = session?.role === 'admin';
  const isValidCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  
  if (!isAdmin && !isValidCron) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
            sub.planName,
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
