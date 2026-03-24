export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// GET /api/messages - list messages for logged-in user
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') || 'inbox'; // inbox, sent

  const messages = await prisma.message.findMany({
    where: folder === 'sent'
      ? { senderId: session.userId }
      : { recipientId: session.userId },
    include: {
      sender: { select: { id: true, fullName: true, email: true, avatar: true } },
      recipient: { select: { id: true, fullName: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ messages });
}

// POST /api/messages - send a message
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recipientId, hotelId, subject, body } = await req.json();
  if (!recipientId || !hotelId || !subject || !body) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.userId,
      recipientId,
      hotelId,
      subject,
      body,
    },
    include: {
      sender: { select: { fullName: true, email: true } },
      recipient: { select: { fullName: true, email: true } },
    },
  });

  // Send email notification
  try {
    const sender = await prisma.user.findUnique({ where: { id: session.userId } });
    if (sender && message.recipient) {
      await sendEmail({
        to: message.recipient.email,
        subject: `New message from ${sender.fullName}: ${subject}`,
        html: `<p>${sender.fullName} sent you a message:</p><p><strong>${subject}</strong></p><p>${body}</p>`,
      });
    }
  } catch (e) { console.error('Email error:', e); }

  return NextResponse.json({ message }, { status: 201 });
}

// PATCH /api/messages/:id - mark as read or reply
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, isRead, reply } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || message.recipientId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.message.update({
    where: { id },
    data: {
      ...(isRead !== undefined && { isRead }),
      ...(reply && { reply, repliedAt: new Date() }),
    },
  });

  return NextResponse.json({ message: updated });
}
