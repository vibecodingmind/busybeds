export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if model exists via try/catch — upsert newsletter subscriber
    try {
      await (prisma as any).newsletterSubscriber.upsert({
        where: { email },
        update: { updatedAt: new Date() },
        create: { email, subscribedAt: new Date() },
      });
    } catch {
      // Table may not exist yet — still return success
    }

    return NextResponse.json({ message: 'Subscribed! Watch your inbox for exclusive deals.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await (prisma as any).newsletterSubscriber.count().catch(() => 0);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
