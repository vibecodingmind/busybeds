export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { ids, action, reason, partnershipStatus, discountPercent } = await req.json();
  if (!ids?.length) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  try {
    let result;
    
    // Handle partnership status update
    if (partnershipStatus) {
      const validPartnershipStatuses = ['ACTIVE', 'INACTIVE', 'LISTING_ONLY'];
      if (!validPartnershipStatuses.includes(partnershipStatus)) {
        return NextResponse.json({ error: 'Invalid partnership status' }, { status: 400 });
      }
      
      result = await prisma.hotel.updateMany({
        where: { id: { in: ids } },
        data: { 
          partnershipStatus: partnershipStatus as any, 
          updatedAt: new Date() 
        },
      });
      
      // Log audit
      try {
        await (prisma as any).auditLog.create({
          data: {
            userId: session.userId,
            action: `bulk_partnership_${partnershipStatus.toLowerCase()}`,
            resource: 'hotel',
            metadata: JSON.stringify({ ids, count: result.count, reason }),
          },
        });
      } catch {}
    }
    // Handle discount update
    else if (discountPercent !== undefined) {
      const discount = Number(discountPercent);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return NextResponse.json({ error: 'Invalid discount percent' }, { status: 400 });
      }
      
      result = await prisma.hotel.updateMany({
        where: { id: { in: ids } },
        data: { 
          discountPercent: discount, 
          updatedAt: new Date() 
        },
      });
      
      // Log audit
      try {
        await (prisma as any).auditLog.create({
          data: {
            userId: session.userId,
            action: 'bulk_discount_update',
            resource: 'hotel',
            metadata: JSON.stringify({ ids, count: result.count, discountPercent: discount }),
          },
        });
      } catch {}
    }
    // Handle status update (original behavior)
    else if (action) {
      const validActions = ['active', 'inactive', 'pending', 'rejected'];
      if (!validActions.includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      result = await prisma.hotel.updateMany({
        where: { id: { in: ids } },
        data: { status: action, updatedAt: new Date() },
      });

      // Log audit
      try {
        await (prisma as any).auditLog.create({
          data: {
            userId: session.userId,
            action: `bulk_${action}`,
            resource: 'hotel',
            metadata: JSON.stringify({ ids, count: result.count, reason }),
          },
        });
      } catch {}
    } else {
      return NextResponse.json({ error: 'action, partnershipStatus, or discountPercent required' }, { status: 400 });
    }

    return NextResponse.json({ updated: result?.count || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
