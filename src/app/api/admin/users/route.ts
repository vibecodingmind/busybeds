export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';

// Valid roles for validation
const VALID_ROLES = ['traveler', 'hotel_owner', 'hotel_manager', 'admin'] as const;
const VALID_ACTIONS = ['ban', 'unban', 'set_role'] as const;

// Input validation schema
const patchSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  action: z.enum(VALID_ACTIONS, { errorMap: () => ({ message: 'Invalid action. Must be ban, unban, or set_role' }) }),
  role: z.enum(VALID_ROLES, { errorMap: () => ({ message: 'Invalid role' }) }).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, role: true,
          createdAt: true, isBanned: true,
          _count: { select: { coupons: true } },
          hotelOwner: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse and validate input
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 });
  }

  const { userId, action, role } = parsed.data;

  // Additional validation: set_role requires a role
  if (action === 'set_role' && !role) {
    return NextResponse.json({ error: 'Role is required for set_role action' }, { status: 400 });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};
    if (action === 'ban') updateData.isBanned = true;
    else if (action === 'unban') updateData.isBanned = false;
    else if (action === 'set_role' && role) updateData.role = role;

    const user = await prisma.user.update({ where: { id: userId }, data: updateData });

    try {
      await (prisma as any).auditLog.create({
        data: { userId: session.userId, action: `user_${action}`, resource: 'user', resourceId: userId, metadata: JSON.stringify({ role }) },
      });
    } catch {}

    return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, isBanned: (user as any).isBanned } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
