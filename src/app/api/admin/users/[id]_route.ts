import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        suspendedAt: true,
        suspendedReason: true,
        subscriptions: {
          select: {
            id: true,
            planName: true,
            status: true,
            expiresAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: { coupons: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const couponCount = user._count.coupons;
    const subscription = user.subscriptions[0] || null;

    return NextResponse.json({ user, subscription, couponCount });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, reason } = body;

    if (!['suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "suspend" or "unsuspend"' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (action === 'suspend') {
      updateData.suspendedAt = new Date();
      updateData.suspendedReason = reason || null;
    } else {
      updateData.suspendedAt = null;
      updateData.suspendedReason = null;
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
