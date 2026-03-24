export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * POST /api/admin/hotels/bulk-delete
 * Body: { ids: string[] }
 * 
 * Bulk delete hotels. Only hotels with status 'inactive' or 'rejected' can be deleted.
 * This will also delete all related coupons, photos, room types, etc. (cascade delete).
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin access
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { ids }: { ids: string[] } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No hotel IDs provided' }, { status: 400 });
    }

    // Verify all hotels exist and are deletable (inactive or rejected)
    const hotels = await prisma.hotel.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, status: true },
    });

    const notDeletable = hotels.filter(h => h.status !== 'inactive' && h.status !== 'rejected');
    if (notDeletable.length > 0) {
      return NextResponse.json({
        error: `Cannot delete hotels that are active or pending. Set them to inactive first.`,
        notDeletable: notDeletable.map(h => ({ id: h.id, name: h.name, status: h.status })),
      }, { status: 400 });
    }

    // Check for IDs that don't exist
    const existingIds = new Set(hotels.map(h => h.id));
    const notFound = ids.filter(id => !existingIds.has(id));
    if (notFound.length > 0) {
      return NextResponse.json({
        error: 'Some hotels not found',
        notFound,
      }, { status: 404 });
    }

    // Delete hotels (cascade will handle related records)
    const result = await prisma.hotel.deleteMany({
      where: {
        id: { in: ids },
        status: { in: ['inactive', 'rejected'] },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} hotel(s)`,
    });
  } catch (error: any) {
    console.error('[Bulk Delete Hotels Error]', error);
    return NextResponse.json(
      { error: 'Failed to delete hotels', details: error.message },
      { status: 500 }
    );
  }
}
