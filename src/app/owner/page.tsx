import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';

async function getData(userId: string) {
  const hotelOwner = await prisma.hotelOwner.findUnique({
    where: { userId },
    include: { hotel: { include: { roomTypes: true, photos: true, affiliateLinks: true } } },
  });
  if (!hotelOwner) return null;

  const hotel = hotelOwner.hotel;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [totalCoupons, activeCoupons, redeemedCoupons, recentCoupons, affiliateClicks] = await Promise.all([
    prisma.coupon.count({ where: { hotelId: hotel.id } }),
    prisma.coupon.count({ where: { hotelId: hotel.id, status: 'active', expiresAt: { gt: now } } }),
    prisma.coupon.count({ where: { hotelId: hotel.id, status: 'redeemed' } }),
    prisma.coupon.findMany({
      where: { hotelId: hotel.id },
      orderBy: { generatedAt: 'desc' },
      take: 10,
      include: { user: { select: { fullName: true, email: true } } },
    }),
    prisma.affiliateLinkClick.groupBy({
      by: ['platform'],
      where: { hotelId: hotel.id, clickedAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  return { hotel, hotelOwner, totalCoupons, activeCoupons, redeemedCoupons, recentCoupons, affiliateClicks };
}

const STATUS_PILL: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  redeemed:  'bg-blue-100 text-blue-700',
  expired:   'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
  pending:   'bg-yellow-100 text-yellow-700',
};

const KYC_INFO: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Under Review', color: 'text-yellow-600' },
  approved: { label: 'Approved', color: 'text-green-600' },
  rejected: { label: 'Rejected', color: 'text-red-600' },
};

export default async function OwnerDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/owner');

  const data = await getData(session.userId);

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">🏨</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Hotel Found</h1>
          <p className="text-gray-500 mb-6">You haven&apos;t registered a hotel yet. Apply to become a hotel owner to access this dashboard.</p>
          <Link href="/apply" className="bg-[#0E7C7B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0a6160] transition-colors">
            Apply as Hotel Owner
          </Link>
        </div>
      </div>
    );
  }

  const { hotel, hotelOwner, totalCoupons, activeCoupons, redeemedCoupons, recentCoupons, affiliateClicks } = data;
  const kyc = KYC_INFO[hotelOwner.kycStatus] || KYC_INFO.pending;

  const stats = [
    { label: 'Total Coupons', value: totalCoupons, icon: '🎫', color: '#1A3C5E' },
    { label: 'Active Coupons', value: activeCoupons, icon: '✅', color: '#0E7C7B' },
    { label: 'Times Redeemed', value: redeemedCoupons, icon: '🏷️', color: '#FF385C' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }} className="px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">🏨</div>
            <div>
              <p className="text-white/70 text-sm mb-1">Hotel Owner Dashboard</p>
              <h1 className="text-2xl font-bold text-white mb-1">{hotel.name}</h1>
              <p className="text-white/70 text-sm">{hotel.city}, {hotel.country}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-white/60">KYC Status:</span>
                <span className={`text-xs font-bold ${kyc.color.replace('text-', 'text-')} bg-white/10 px-2 py-0.5 rounded-full`}>
                  {kyc.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Hotel Info + Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Hotel Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium">{hotel.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Star Rating</span>
                <span className="font-medium">{'⭐'.repeat(hotel.starRating)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Default Discount</span>
                <span className="font-bold text-[#FF385C]">{hotel.discountPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Room Types</span>
                <span className="font-medium">{hotel.roomTypes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Photos</span>
                <span className="font-medium">{hotel.photos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Partner Links</span>
                <span className="font-medium">{hotel.affiliateLinks.length}</span>
              </div>
            </div>
            <Link href={`/hotels/${hotel.slug}`}
              className="mt-4 block w-full text-center py-2 rounded-xl text-sm font-semibold bg-[#F2F4F7] text-gray-700 hover:bg-gray-200 transition-colors">
              View Hotel Page
            </Link>
            <Link href="/owner/edit"
              className="mt-2 block w-full text-center py-2 rounded-xl text-sm font-semibold border border-[#0E7C7B] text-[#0E7C7B] hover:bg-[#0E7C7B]/5 transition-colors">
              ✏️ Edit Hotel Details
            </Link>
            <Link href="/owner/reviews"
              className="mt-2 block w-full text-center py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              💬 Reply to Reviews
            </Link>
          </div>

          {/* Affiliate click stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Affiliate Clicks (last 30 days)</h2>
            {affiliateClicks.length === 0 ? (
              <p className="text-sm text-gray-400">No clicks recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {affiliateClicks.map(c => (
                  <div key={c.platform} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{c.platform.replace(/_/g, '.')}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-[#0E7C7B]"
                        style={{ width: `${Math.max(20, (c._count.id / (affiliateClicks[0]._count.id || 1)) * 80)}px` }} />
                      <span className="text-sm font-bold text-gray-900">{c._count.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Coupon Redemptions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Coupons</h2>
          </div>
          {recentCoupons.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">No coupons generated for this hotel yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentCoupons.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.user.fullName}</div>
                      <div className="text-xs text-gray-400">{c.user.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.code}</td>
                    <td className="px-4 py-3 font-bold text-[#FF385C]">{c.discountPercent}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_PILL[c.status] || 'bg-gray-100 text-gray-500'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(c.generatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
