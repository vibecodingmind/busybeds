import Link from 'next/link';
import prisma from '@/lib/prisma';
import CouponExpiryReminderButton from '@/components/CouponExpiryReminderButton';

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Sequential queries to avoid connection pool exhaustion (Supabase connection_limit=1)
  const totalUsers     = await prisma.user.count();
  const totalHotels    = await prisma.hotel.count({ where: { status: 'active' } });
  const activeSubs     = await prisma.subscription.count({ where: { status: 'active', expiresAt: { gt: now } } });
  const totalCoupons   = await prisma.coupon.count();
  const redeemed       = await prisma.coupon.count({ where: { status: 'redeemed' } });
  const pendingKyc     = await prisma.hotelOwner.count({ where: { kycStatus: 'pending' } });
  const monthlyRevenue = await prisma.subscription.count({ where: { status: 'active', createdAt: { gte: thirtyDaysAgo } } });
  return { totalUsers, totalHotels, activeSubs, totalCoupons, redeemed, pendingKyc, monthlyRevenue };
}

async function getRecentData() {
  // Sequential queries to avoid connection pool exhaustion (Supabase connection_limit=1)
  const kycApplications = await prisma.hotelOwner.findMany({
    where: { kycStatus: 'pending' },
    include: {
      user: { select: { fullName: true, email: true } },
      hotel: { select: { name: true, city: true } },
    },
    orderBy: { kycSubmittedAt: 'desc' },
    take: 5,
  });
  const recentCoupons = await prisma.coupon.findMany({
    orderBy: { generatedAt: 'desc' }, take: 8,
    include: {
      hotel: { select: { name: true } },
      user: { select: { fullName: true, avatar: true } },
    },
  });
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }, take: 5,
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
  });
  const recentHotels = await prisma.hotel.findMany({
    orderBy: { createdAt: 'desc' }, take: 5,
    include: { _count: { select: { coupons: true } } },
  });
  return { kycApplications, recentCoupons, recentUsers, recentHotels };
}

export default async function AdminPage() {
  const stats = await getStats();
  const data  = await getRecentData();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Home</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's what's happening today</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Booked (coupons) */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #E8395A 0%, #BD1E59 100%)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Total Coupons</p>
              <p className="text-3xl font-extrabold mt-1">{stats.totalCoupons.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 14l2 2 4-4"/></svg>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <span className="bg-white/20 rounded-full px-2 py-0.5 font-semibold">✅ {stats.redeemed} redeemed</span>
          </div>
          {/* Sparkline placeholder */}
          <svg className="absolute right-0 bottom-0 opacity-20" width="80" height="40" viewBox="0 0 80 40"><polyline points="0,35 15,28 30,32 45,18 60,22 75,10 80,14" fill="none" stroke="white" strokeWidth="2"/></svg>
        </div>

        {/* 30 Days New Subs */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">New Subs (30d)</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{(stats.monthlyRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth={2}><path strokeLinecap="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <svg className="w-full" height="32" viewBox="0 0 120 32"><polyline points="0,28 20,22 40,25 60,14 80,18 100,8 120,12" fill="none" stroke="#E8395A" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>

        {/* Total Hotels */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Hotels</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalHotels.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0D9488" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            </div>
          </div>
          <svg className="w-full" height="32" viewBox="0 0 120 32"><polyline points="0,25 20,20 40,22 60,16 80,18 100,12 120,8" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>

        {/* Total Users */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth={2}><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
          </div>
          <svg className="w-full" height="32" viewBox="0 0 120 32"><polyline points="0,28 20,24 40,26 60,18 80,20 100,12 120,10" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </div>

      {/* Middle row — Pending KYC + Recent Coupons */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Pending KYC/Claims - task card style */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Pending Claims</h2>
            {stats.pendingKyc > 0 && (
              <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">{stats.pendingKyc} pending</span>
            )}
          </div>

          {data.kycApplications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={2}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-sm text-gray-500">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.kycApplications.map(app => (
                <div key={app.id} className="p-3.5 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{app.user.fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{app.hotel.name} · {app.hotel.city}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{app.user.email}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <KycActionButton applicationId={app.id} action="approve" />
                      <KycActionButton applicationId={app.id} action="reject" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {stats.pendingKyc > 5 && (
            <Link href="/admin/kyc" className="block mt-3 text-xs text-center font-semibold" style={{ color: '#E8395A' }}>
              View all {stats.pendingKyc} applications →
            </Link>
          )}
        </div>

        {/* Recent Coupons */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Coupons</h2>
            <Link href="/admin/coupons" className="text-xs font-semibold" style={{ color: '#E8395A' }}>View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 font-semibold">User</th>
                  <th className="pb-2 font-semibold">Hotel</th>
                  <th className="pb-2 font-semibold">Discount</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentCoupons.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8395A, #BD1E59)' }}>
                          {c.user.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[100px]">{c.user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-500 truncate max-w-[120px]">{c.hotel.name}</td>
                    <td className="py-2.5 pr-3">
                      <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{c.discountPercent}% off</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.status === 'active' ? 'bg-green-50 text-green-700' :
                        c.status === 'redeemed' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom row — Recent Users + Recent Hotels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">New Users</h2>
            <Link href="/admin/users" className="text-xs font-semibold" style={{ color: '#E8395A' }}>Manage →</Link>
          </div>
          <div className="space-y-2.5">
            {data.recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A3C5E, #2563EB)' }}>
                    {u.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{u.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  u.role === 'admin' ? 'bg-red-50 text-red-600' :
                  u.role === 'hotel_owner' || u.role === 'hotel_manager' ? 'bg-purple-50 text-purple-700' :
                  'bg-blue-50 text-blue-700'
                }`}>{u.role.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Hotels */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Hotels</h2>
            <Link href="/admin/hotels" className="text-xs font-semibold" style={{ color: '#E8395A' }}>Manage →</Link>
          </div>
          <div className="space-y-2.5">
            {data.recentHotels.map(h => (
              <div key={h.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0D9488" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.city}, {h.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{h._count.coupons} coupons</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/hotels/new',       label: 'Add Hotel',      icon: '🏨', color: 'bg-teal-50 border-teal-100 text-teal-800' },
          { href: '/admin/packages',         label: 'Manage Plans',   icon: '💳', color: 'bg-purple-50 border-purple-100 text-purple-800' },
          { href: '/admin/kyc',              label: `KYC (${stats.pendingKyc})`, icon: '⏳', color: 'bg-orange-50 border-orange-100 text-orange-800' },
          { href: '/admin/flash-deals',      label: 'Flash Deals',    icon: '⚡', color: 'bg-yellow-50 border-yellow-100 text-yellow-800' },
          { href: '/admin/affiliate-clicks', label: 'Affiliate Clicks', icon: '🔗', color: 'bg-blue-50 border-blue-100 text-blue-800' },
          { href: '/admin/settings',         label: 'API Settings',   icon: '⚙️', color: 'bg-gray-50 border-gray-200 text-gray-700' },
        ].map(q => (
          <Link key={q.href} href={q.href} className={`flex items-center gap-3 p-4 rounded-2xl border font-semibold text-sm transition-all hover:shadow-sm ${q.color}`}>
            <span className="text-xl">{q.icon}</span>
            {q.label}
          </Link>
        ))}
      </div>

      {/* ── Coupon Expiry Reminder ── */}
      <CouponExpiryReminderButton />
    </div>
  );
}

function KycActionButton({ applicationId, action }: { applicationId: string; action: 'approve' | 'reject' }) {
  return (
    <form>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="action" value={action} />
      <button
        formAction={async (formData: FormData) => {
          'use server';
          const { prisma: db } = await import('@/lib/prisma');
          const id = formData.get('applicationId') as string;
          const act = formData.get('action') as string;
          await db.hotelOwner.update({
            where: { id },
            data: { kycStatus: act === 'approve' ? 'approved' : 'rejected', kycReviewedAt: new Date() },
          });
          const { revalidatePath } = await import('next/cache');
          revalidatePath('/admin');
        }}
        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${action === 'approve' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
      >
        {action === 'approve' ? 'Approve' : 'Reject'}
      </button>
    </form>
  );
}
