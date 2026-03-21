import UsersClient from './UsersClient';
import prisma from '@/lib/prisma';

export const metadata = { title: 'Users — BusyBeds Admin' };

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, fullName: true, role: true,
      createdAt: true, suspendedAt: true, avatar: true,
      _count: { select: { subscriptions: true, coupons: true } },
    },
    take: 200,
  });

  return <UsersClient initialUsers={users as any} />;
}
