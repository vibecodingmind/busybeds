export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * GET /api/coupons/pdf?code=XXX
 * Returns an HTML page designed for printing as a PDF coupon.
 * The client opens this URL and calls window.print() or the browser prints it.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const code = new URL(req.url).searchParams.get('code');
  if (!code) return new NextResponse('Missing code', { status: 400 });

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: {
      hotel: { select: { name: true, city: true, country: true, address: true, starRating: true, category: true, coverImage: true, websiteUrl: true } },
      user: { select: { fullName: true } },
    },
  });

  if (!coupon || coupon.userId !== session.userId) {
    return new NextResponse('Not found', { status: 404 });
  }

  const stars = '★'.repeat(coupon.hotel.starRating) + '☆'.repeat(5 - coupon.hotel.starRating);
  const expiryDate = new Date(coupon.expiresAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const isExpired = coupon.status !== 'active';
  const isRedeemed = coupon.status === 'redeemed';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BusyBeds Coupon – ${coupon.hotel.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #F2F4F7;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .coupon {
      width: 680px;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
      position: relative;
    }
    .coupon.expired { opacity: 0.7; }
    .header {
      background: linear-gradient(135deg, #1A3C5E 0%, #0E7C7B 100%);
      padding: 28px 32px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .logo-sub { font-size: 11px; opacity: 0.7; margin-top: 2px; }
    .discount-badge {
      background: #E8395A;
      color: white;
      border-radius: 16px;
      padding: 10px 20px;
      text-align: center;
      transform: rotate(3deg);
    }
    .discount-pct { font-size: 42px; font-weight: 900; line-height: 1; }
    .discount-off { font-size: 14px; font-weight: bold; }
    .hotel-section {
      display: flex;
      gap: 0;
    }
    .hotel-image {
      width: 200px;
      height: 160px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .hotel-info {
      padding: 20px 24px;
      flex: 1;
    }
    .stars { color: #F59E0B; font-size: 16px; margin-bottom: 4px; }
    .hotel-name { font-size: 22px; font-weight: 800; color: #1A3C5E; line-height: 1.2; margin-bottom: 4px; }
    .hotel-loc { color: #6B7280; font-size: 13px; margin-bottom: 8px; }
    .hotel-cat { display: inline-block; background: #F3F4F6; color: #374151; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
    .divider {
      display: flex;
      align-items: center;
      margin: 0;
    }
    .divider-line { flex: 1; border-top: 2px dashed #E5E7EB; }
    .divider-circle { width: 24px; height: 24px; background: #F2F4F7; border-radius: 50%; flex-shrink: 0; }
    .code-section {
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .code-label { font-size: 11px; color: #9CA3AF; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .code { font-family: 'Courier New', monospace; font-size: 28px; font-weight: 900; color: #1A3C5E; letter-spacing: 4px; }
    .qr-block { text-align: center; }
    .qr-img { width: 90px; height: 90px; border-radius: 10px; border: 2px solid #E5E7EB; }
    .qr-label { font-size: 10px; color: #9CA3AF; margin-top: 4px; }
    .details-section {
      padding: 16px 32px;
      background: #F9FAFB;
      display: flex;
      gap: 16px;
    }
    .detail-item { flex: 1; }
    .detail-label { font-size: 10px; color: #9CA3AF; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .detail-value { font-size: 13px; color: #374151; font-weight: 600; }
    .footer {
      padding: 14px 32px;
      background: #1A3C5E;
      color: rgba(255,255,255,0.7);
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-banner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      font-size: 60px;
      font-weight: 900;
      color: rgba(239, 68, 68, 0.3);
      text-transform: uppercase;
      pointer-events: none;
      letter-spacing: 4px;
      white-space: nowrap;
    }
    @media print {
      body { background: white; padding: 0; }
      .coupon { box-shadow: none; border-radius: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <!-- Print button (hidden when printing) -->
    <div class="no-print" style="text-align:center;margin-bottom:16px">
      <button onclick="window.print()" style="background:#0E7C7B;color:white;border:none;padding:10px 28px;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background:#F3F4F6;color:#374151;border:none;padding:10px 20px;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer;margin-left:10px">
        ✕ Close
      </button>
    </div>

    <div class="coupon${isExpired ? ' expired' : ''}">
      ${isRedeemed ? '<div class="status-banner">REDEEMED</div>' : ''}
      ${isExpired && !isRedeemed ? '<div class="status-banner">EXPIRED</div>' : ''}

      <!-- Header -->
      <div class="header">
        <div>
          <div class="logo">🏨 BusyBeds</div>
          <div class="logo-sub">Hotel Discount Coupon</div>
        </div>
        <div class="discount-badge">
          <div class="discount-pct">${coupon.discountPercent}%</div>
          <div class="discount-off">OFF</div>
        </div>
      </div>

      <!-- Hotel -->
      <div class="hotel-section">
        ${coupon.hotel.coverImage ? `<img src="${coupon.hotel.coverImage}" class="hotel-image" alt="${coupon.hotel.name}" />` : ''}
        <div class="hotel-info">
          <div class="stars">${stars}</div>
          <div class="hotel-name">${coupon.hotel.name}</div>
          <div class="hotel-loc">📍 ${coupon.hotel.address || coupon.hotel.city}, ${coupon.hotel.country}</div>
          <span class="hotel-cat">${coupon.hotel.category}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider">
        <div class="divider-circle"></div>
        <div class="divider-line"></div>
        <div class="divider-circle"></div>
      </div>

      <!-- Coupon Code -->
      <div class="code-section">
        <div>
          <div class="code-label">Coupon Code</div>
          <div class="code">${coupon.code}</div>
          <div style="font-size:12px;color:#9CA3AF;margin-top:6px">Issued to: ${coupon.user.fullName}</div>
        </div>
        ${coupon.qrDataUrl ? `
          <div class="qr-block">
            <img src="${coupon.qrDataUrl}" class="qr-img" alt="QR Code" />
            <div class="qr-label">Scan at hotel</div>
          </div>
        ` : ''}
      </div>

      <!-- Details -->
      <div class="details-section">
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value" style="color:${coupon.status === 'active' ? '#059669' : coupon.status === 'redeemed' ? '#2563EB' : '#EF4444'}">${coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Valid Until</div>
          <div class="detail-value">${expiryDate}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Discount</div>
          <div class="detail-value" style="color:#E8395A">${coupon.discountPercent}% off your stay</div>
        </div>
        ${coupon.hotel.websiteUrl ? `
          <div class="detail-item">
            <div class="detail-label">Website</div>
            <div class="detail-value"><a href="${coupon.hotel.websiteUrl}" style="color:#0E7C7B;text-decoration:none">${coupon.hotel.websiteUrl.replace(/https?:\/\//, '')}</a></div>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        <span>Present this coupon at check-in to receive your discount.</span>
        <span>busybeds.com</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
