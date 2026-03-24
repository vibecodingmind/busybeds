export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// SDASMS Configuration
const SDASMS_API_TOKEN = process.env.SDASMS_API_TOKEN || '';
const SDASMS_ENDPOINT = 'https://my.sdasms.com/api/http/sms/send';

/**
 * POST /api/sms/send
 * Send SMS via SDASMS API with sender_id support
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, phone, message, senderId } = await req.json();

  // Validate inputs
  if (!phone || !message || !senderId) {
    return NextResponse.json({ error: 'phone, message, and senderId are required' }, { status: 400 });
  }

  // Validate sender ID (max 11 chars for alphanumeric)
  if (senderId.length > 11) {
    return NextResponse.json({ error: 'Sender ID must be max 11 characters' }, { status: 400 });
  }

  // Log the SMS in database first
  const smsLog = await prisma.sMSLog.create({
    data: {
      userId: userId || null,
      phone,
      message,
      provider: 'sdasms',
      status: 'pending',
    },
  });

  // Send SMS via SDASMS API
  try {
    const response = await fetch(SDASMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        api_token: SDASMS_API_TOKEN,
        recipient: phone,
        sender_id: senderId,
        type: 'plain',
        message: message,
      }),
    });

    const result = await response.json();

    // Update SMS log with SDASMS response
    if (result.status === 'success') {
      await prisma.sMSLog.update({
        where: { id: smsLog.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return NextResponse.json({
        smsLog: { ...smsLog, status: 'sent' },
        sdasmsResponse: result,
      }, { status: 201 });
    } else {
      // SMS failed
      await prisma.sMSLog.update({
        where: { id: smsLog.id },
        data: {
          status: 'failed',
        },
      });

      return NextResponse.json({
        error: result.message || 'Failed to send SMS',
        smsLog: { ...smsLog, status: 'failed' },
      }, { status: 400 });
    }
  } catch (error: any) {
    // Network or other error
    await prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'failed',
      },
    });

    console.error('SDASMS Error:', error);
    return NextResponse.json({
      error: 'Failed to send SMS: ' + error.message,
      smsLog: { ...smsLog, status: 'failed' },
    }, { status: 500 });
  }
}

/**
 * GET /api/sms/send?phone=...&message=...&senderId=...
 * Alternative GET method for SDASMS compatibility
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const message = searchParams.get('message');
  const senderId = searchParams.get('senderId') || searchParams.get('sender_id');

  if (!phone || !message || !senderId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Forward to POST
  const postReq = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ phone, message, senderId }),
  });

  return POST(postReq as NextRequest);
}
