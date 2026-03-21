import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ProfileClient from './ProfileClient';

export const metadata = { title: 'My Profile — Busy Beds' };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/profile');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, avatar: true },
  });
  if (!user) redirect('/login');

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId, status: 'active', expiresAt: { gt: new Date() } },
    include: { package: true },
    orderBy: { expiresAt: 'desc' },
  });

  const couponCount = await prisma.coupon.count({ where: { userId: session.userId } });
  const redeemedCount = await prisma.coupon.count({ where: { userId: session.userId, status: 'redeemed' } });

  return (
    <div className="min-h-screen">
      <Navbar />
      <ProfileClient
        user={user}
        subscription={sub ? { packageName: sub.package.name, expiresAt: sub.expiresAt.toISOString() } : null}
        stats={{ total: couponCount, redeemed: redeemedCount }}
      />
    </div>
  );
}
