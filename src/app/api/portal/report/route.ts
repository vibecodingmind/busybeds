import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  
  // Allow hotel_owner, hotel_manager, or admin to download reports
  if (!session || !['hotel_owner', 'hotel_manager', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get hotel for the logged-in user
    const hotelOwner = await prisma.hotelOwner.findFirst({
      where: { userId: session.userId },
      select: { hotelId: true },
    });

    if (!hotelOwner && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'No hotel assigned to this user' },
        { status: 404 }
      );
    }

    const hotelId = hotelOwner?.hotelId;
    if (!hotelId && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot determine hotel' },
        { status: 400 }
      );
    }

    // Fetch coupons
    const coupons = await prisma.coupon.findMany({
      where: hotelId ? { hotelId } : undefined,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    // Build CSV
    const headers = ['Code', 'Guest Name', 'Guest Email', 'Discount %', 'Status', 'Generated At', 'Expires At', 'Redeemed At'];
    const rows = coupons.map(c => [
      c.code,
      c.user.fullName,
      c.user.email,
      c.discountPercent.toString(),
      c.status,
      c.generatedAt.toISOString().split('T')[0],
      c.expiresAt.toISOString().split('T')[0],
      c.redeemedAt ? c.redeemedAt.toISOString().split('T')[0] : '',
    ]);

    // Create CSV content
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="coupons-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
