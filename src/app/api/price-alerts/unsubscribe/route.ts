/**
 * GET /api/price-alerts/unsubscribe?id=<alertId>&token=<base64email>
 *
 * One-click unsubscribe from a price alert.
 * Token is base64-encoded email — simple tamper-evident check.
 * Returns a friendly HTML confirmation page.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

function successPage(hotelName: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed — BusyBeds</title>
  <style>
    body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:16px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:800;color:#1D2939;margin:0 0 8px}
    p{color:#6B7280;font-size:14px;margin:0 0 24px;line-height:1.6}
    a{display:inline-block;background:linear-gradient(135deg,#1A3C5E,#0E7C7B);color:white;padding:12px 28px;border-radius:10px;font-weight:bold;text-decoration:none;font-size:14px}
  </style></head><body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>You've been unsubscribed</h1>
    <p>You'll no longer receive price alert emails for <strong>${hotelName}</strong>.</p>
    <a href="${APP_URL}/hotels">Explore other hotels</a>
  </div>
  </body></html>`;
}

function errorPage(message: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Error — BusyBeds</title>
  <style>
    body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:16px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:800;color:#1D2939;margin:0 0 8px}
    p{color:#6B7280;font-size:14px;margin:0 0 24px;line-height:1.6}
    a{display:inline-block;background:#FF385C;color:white;padding:12px 28px;border-radius:10px;font-weight:bold;text-decoration:none;font-size:14px}
  </style></head><body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Invalid link</h1>
    <p>${message}</p>
    <a href="${APP_URL}">Go to BusyBeds</a>
  </div>
  </body></html>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const token = searchParams.get('token');

  if (!id || !token) {
    return new NextResponse(errorPage('Missing parameters. This link may be broken.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Find the alert
  const alert = await (prisma as any).priceAlert.findUnique({
    where: { id },
    include: { hotel: { select: { name: true } } },
  });

  if (!alert) {
    return new NextResponse(errorPage('This alert was not found. It may have already been removed.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Verify token (base64-encoded email)
  let tokenEmail = '';
  try {
    tokenEmail = Buffer.from(token, 'base64').toString('utf-8');
  } catch {
    return new NextResponse(errorPage('Invalid unsubscribe token.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (tokenEmail !== alert.email) {
    return new NextResponse(errorPage('Unsubscribe token does not match.'), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Deactivate the alert
  await (prisma as any).priceAlert.update({
    where: { id },
    data: { isActive: false },
  });

  return new NextResponse(successPage(alert.hotel.name), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
