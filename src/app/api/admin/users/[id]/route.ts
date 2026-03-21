export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { fullName, email, role, action } = body;

  // Prevent admin from demoting themselves
  if (params.id === session.userId && role && role !== 'admin') {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
  }

  if (action === 'suspend') {
    const user = await prisma.user.update({ where: { id: params.id }, data: { suspendedAt: new Date() }, select: { id: true } });
    return NextResponse.json({ user });
  }
  if (action === 'unsuspend') {
    const user = await prisma.user.update({ where: { id: params.id }, data: { suspendedAt: null }, select: { id: true } });
    return NextResponse.json({ user });
  }

  const updateData: Record<string, unknown> = {};
  if (fullName) updateData.fullName = fullName;
  if (email)    updateData.email    = email;
  if (role)     updateData.role     = role;

  const user = await prisma.user.update({
    where: { id: params.id }, data: updateData,
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, suspendedAt: true, avatar: true, _count: { select: { subscriptions: true, coupons: true } } },
  });
  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (params.id === session.userId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
