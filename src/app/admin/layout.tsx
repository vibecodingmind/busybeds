import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export const metadata = { title: 'Admin — BusyBeds' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  // Load notifications sequentially to avoid connection pool exhaustion
  const pendingKyc = await prisma.hotelOwner.findMany({
    where: { kycStatus: 'pending' },
    include: { user: { select: { fullName: true } }, hotel: { select: { name: true } } },
    orderBy: { kycSubmittedAt: 'desc' },
    take: 10,
  });
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { fullName: true, email: true, createdAt: true, role: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const notifications = [
    ...pendingKyc.map(k => ({
      id: k.id,
      type: 'kyc' as const,
      title: `${k.user.fullName} claims ${k.hotel.name}`,
      body: 'Pending KYC review',
      time: k.kycSubmittedAt?.toISOString() ?? new Date().toISOString(),
    })),
    ...recentUsers.map(u => ({
      id: u.email,
      type: 'user' as const,
      title: `New ${u.role.replace('_', ' ')}: ${u.fullName}`,
      body: u.email,
      time: u.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 12);

  const adminUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, email: true, avatar: true },
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          notifications={notifications}
          adminUser={adminUser ? { fullName: adminUser.fullName, email: adminUser.email, avatar: adminUser.avatar } : null}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
