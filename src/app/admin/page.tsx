import Link from 'next/link';
import prisma from '@/lib/prisma';

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const totalUsers = await prisma.user.count();
  const totalHotels = await prisma.hotel.count({ where: { status: 'active' } });
  const activeSubs = await prisma.subscription.count({ where: { status: 'active', expiresAt: { gt: now } } });
  const totalCoupons = await prisma.coupon.count();
  const redeemed = await prisma.coupon.count({ where: { status: 'redeemed' } });
  const pendingKyc = await prisma.hotelOwner.count({ where: { kycStatus: 'pending' } });
  const monthlyRevenue = await prisma.subscription.count({ where: { status: 'active', createdAt: { gte: thirtyDaysAgo } } });
  const weeklyUsers = await prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } });
  
  return { totalUsers, totalHotels, activeSubs, totalCoupons, redeemed, pendingKyc, monthlyRevenue, weeklyUsers };
}

async function getRecentData() {
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
    orderBy: { generatedAt: 'desc' }, take: 6,
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
  const data = await getRecentData();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">${(stats.monthlyRevenue * 9.99).toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                    +12.5%
                  </span>
                  <span className="text-xs text-slate-400">vs last month</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
            </div>
            {/* Mini Chart */}
            <svg className="absolute right-0 bottom-0 opacity-10" width="120" height="60" viewBox="0 0 120 60">
              <polyline points="0,50 20,40 40,45 60,25 80,30 100,15 120,20" fill="none" stroke="url(#purple)" strokeWidth="3"/>
              <defs><linearGradient id="purple" x1="0" y1="0" x2="120" y2="0"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#d946ef"/></linearGradient></defs>
            </svg>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Users</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalUsers.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold text-blue-500">+{stats.weeklyUsers}</span>
                  <span className="text-xs text-slate-400">this week</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Total Hotels Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Hotels</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalHotels.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold text-emerald-500">Active</span>
                  <span className="text-xs text-slate-400">partners</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 7V5M8 7V5M16 7V5M12 11v4M8 11v4M16 11v4"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Total Coupons Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Coupons</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalCoupons.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold text-rose-500">{stats.redeemed}</span>
                  <span className="text-xs text-slate-400">redeemed</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  <path d="M9 14l2 2 4-4"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Pending KYC */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Pending Claims</h2>
                <p className="text-sm text-slate-400 mt-0.5">KYC verification required</p>
              </div>
              {stats.pendingKyc > 0 && (
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/30">
                  {stats.pendingKyc} pending
                </span>
              )}
            </div>
            
            <div className="p-4">
              {data.kycApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2">
                      <path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-700">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending KYC applications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.kycApplications.map(app => (
                    <div key={app.id} className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{app.user.fullName}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{app.hotel.name}</p>
                          <p className="text-xs text-slate-400">{app.hotel.city}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <form>
                            <button
                              formAction={async (formData: FormData) => {
                                'use server';
                                const { prisma: db } = await import('@/lib/prisma');
                                await db.hotelOwner.update({
                                  where: { id: app.id },
                                  data: { kycStatus: 'approved', kycReviewedAt: new Date() },
                                });
                                const { revalidatePath } = await import('next/cache');
                                revalidatePath('/admin');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                          </form>
                          <form>
                            <button
                              formAction={async (formData: FormData) => {
                                'use server';
                                const { prisma: db } = await import('@/lib/prisma');
                                await db.hotelOwner.update({
                                  where: { id: app.id },
                                  data: { kycStatus: 'rejected', kycReviewedAt: new Date() },
                                });
                                const { revalidatePath } = await import('next/cache');
                                revalidatePath('/admin');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {stats.pendingKyc > 5 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <Link href="/admin/kyc" className="text-sm font-semibold text-pink-500 hover:text-pink-600 flex items-center gap-1">
                  View all {stats.pendingKyc} applications
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Coupons */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Recent Coupons</h2>
                <p className="text-sm text-slate-400 mt-0.5">Latest discount activities</p>
              </div>
              <Link href="/admin/coupons" className="text-sm font-semibold text-pink-500 hover:text-pink-600">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Hotel</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Discount</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentCoupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                            {c.user.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700">{c.user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{c.hotel.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-600">
                          {c.discountPercent}% off
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          c.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                          c.status === 'redeemed' ? 'bg-blue-50 text-blue-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two Column Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">New Users</h2>
                <Link href="/admin/users" className="text-xs font-semibold text-pink-500">Manage →</Link>
              </div>
              <div className="p-4 space-y-3">
                {data.recentUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                        {u.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{u.fullName}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[140px]">{u.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      u.role === 'admin' ? 'bg-rose-50 text-rose-600' :
                      u.role === 'hotel_owner' ? 'bg-violet-50 text-violet-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Hotels */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">Recent Hotels</h2>
                <Link href="/admin/hotels" className="text-xs font-semibold text-pink-500">Manage →</Link>
              </div>
              <div className="p-4 space-y-3">
                {data.recentHotels.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 truncate max-w-[120px]">{h.name}</p>
                        <p className="text-xs text-slate-400">{h.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{h._count.coupons} coupons</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { href: '/admin/hotels/new', label: 'Add Hotel', icon: '🏨', gradient: 'from-emerald-500 to-teal-500' },
          { href: '/admin/packages', label: 'Packages', icon: '💳', gradient: 'from-violet-500 to-purple-500' },
          { href: '/admin/kyc', label: `KYC (${stats.pendingKyc})`, icon: '⏳', gradient: 'from-orange-500 to-amber-500' },
          { href: '/admin/flash-deals', label: 'Flash Deals', icon: '⚡', gradient: 'from-yellow-500 to-orange-500' },
          { href: '/admin/analytics', label: 'Analytics', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
          { href: '/admin/settings', label: 'Settings', icon: '⚙️', gradient: 'from-slate-500 to-slate-600' },
        ].map(q => (
          <Link
            key={q.href}
            href={q.href}
            className="group relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${q.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />
            <div className="relative flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:border-slate-200 transition-all group-hover:-translate-y-1">
              <span className="text-2xl">{q.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{q.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
