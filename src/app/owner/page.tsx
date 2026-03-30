import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';

async function getData(userId: string) {
  const hotelOwner = await prisma.hotelOwner.findUnique({
    where: { userId },
    include: { 
      hotel: { 
        include: { 
          roomTypes: true, 
          photos: true, 
          affiliateLinks: true,
          subscription: {
            include: { tier: true },
          },
        } 
      } 
    },
  });
  if (!hotelOwner) return null;

  const hotel = hotelOwner.hotel;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  // 4-week coupon analytics
  const fourWeeksAgo = new Date(now.getTime() - 28 * 86400000);
  const [totalCoupons, activeCoupons, redeemedCoupons, recentCoupons, affiliateClicks, weekCoupons] = await Promise.all([
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
    prisma.coupon.findMany({
      where: { hotelId: hotel.id, generatedAt: { gte: fourWeeksAgo } },
      select: { generatedAt: true, status: true },
    }),
  ]);

  // Group weekCoupons into 4 buckets (week 1 = oldest, week 4 = latest)
  const weeks: { label: string; generated: number; redeemed: number }[] = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(fourWeeksAgo.getTime() + i * 7 * 86400000);
    const weekEnd   = new Date(weekStart.getTime() + 7 * 86400000);
    const label = `W${i + 1}`;
    const bucket = weekCoupons.filter(c => c.generatedAt >= weekStart && c.generatedAt < weekEnd);
    return { label, generated: bucket.length, redeemed: bucket.filter(c => c.status === 'redeemed').length };
  });

  return { hotel, hotelOwner, totalCoupons, activeCoupons, redeemedCoupons, recentCoupons, affiliateClicks, weeks };
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

const SUB_COLORS: Record<string, string> = {
  starter: 'bg-green-100 text-green-700',
  growth: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
};

export default async function OwnerDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/owner');

  const params = await searchParams;
  const justClaimed = params.welcome === 'claimed';

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

  const { hotel, hotelOwner, totalCoupons, activeCoupons, redeemedCoupons, recentCoupons, affiliateClicks, weeks } = data;
  const kyc = KYC_INFO[hotelOwner.kycStatus] || KYC_INFO.pending;

  const stats = [
    { label: 'Total Coupons', value: totalCoupons, icon: '🎫', color: '#1A3C5E' },
    { label: 'Active Coupons', value: activeCoupons, icon: '✅', color: '#0E7C7B' },
    { label: 'Times Redeemed', value: redeemedCoupons, icon: '🏷️', color: '#FF385C' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />

      {/* Welcome banner — shown right after hotel claim registration */}
      {justClaimed && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-4">
          <div className="max-w-5xl mx-auto flex items-start gap-3">
            <span className="text-2xl shrink-0">🎉</span>
            <div>
              <p className="font-bold text-amber-800 text-sm">Claim submitted for <span className="underline">{hotel.name}</span>!</p>
              <p className="text-amber-700 text-sm mt-0.5">
                Our team will verify your ownership and approve your claim within <strong>24–48 hours</strong>.
                You&apos;ll receive an email once it&apos;s approved. In the meantime, you can explore your dashboard below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }} className="px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">🏨</div>
            <div>
              <p className="text-white/70 text-sm mb-1">Hotel Owner Dashboard</p>
              <h1 className="text-2xl font-bold text-white mb-1">{hotel.name}</h1>
              <p className="text-white/70 text-sm">{hotel.city}, {hotel.country}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-white/60">KYC Status:</span>
                <span className={`text-xs font-bold ${kyc.color.replace('text-', 'text-')} bg-white/10 px-2 py-0.5 rounded-full`}>
                  {kyc.label}
                </span>
                {(hotel as any).subscription?.status === 'active' && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUB_COLORS[(hotel as any).subscription.tier.name] || 'bg-gray-100 text-gray-700'}`}>
                    {(hotel as any).subscription.tier.displayName}
                  </span>
                )}
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

        {/* 4-week coupon trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Coupon Trend — Last 4 Weeks</h2>
          {(() => {
            const maxVal = Math.max(1, ...weeks.map(w => w.generated));
            const BAR_H = 80;
            return (
              <div className="flex items-end gap-3">
                {weeks.map(w => (
                  <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">{w.generated}</span>
                    <div className="w-full flex flex-col-reverse gap-0.5">
                      <div
                        className="w-full rounded-t-md"
                        style={{ height: `${Math.round((w.generated / maxVal) * BAR_H)}px`, background: '#1A3C5E', minHeight: w.generated > 0 ? '4px' : '0' }}
                      />
                      {w.redeemed > 0 && (
                        <div
                          className="w-full rounded-t-md"
                          style={{ height: `${Math.round((w.redeemed / maxVal) * BAR_H)}px`, background: '#0E7C7B', minHeight: '4px' }}
                          title={`${w.redeemed} redeemed`}
                        />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-500">{w.label}</span>
                  </div>
                ))}
                <div className="ml-2 text-[10px] text-gray-400 space-y-1 self-center">
                  <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#1A3C5E' }}/> Generated</div>
                  <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#0E7C7B' }}/> Redeemed</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Feature Your Hotel */}
        {(() => {
          const featuredUntil = (hotel as any).featuredUntil ? new Date((hotel as any).featuredUntil) : null;
          const isFeaturedActive = hotel.isFeatured && featuredUntil && featuredUntil > new Date();
          const isExpired = hotel.isFeatured && featuredUntil && featuredUntil <= new Date();
          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-gray-900 mb-1">⭐ Feature Your Hotel</h2>
                  <p className="text-sm text-gray-500 mb-3">
                    {isFeaturedActive
                      ? `Your hotel is featured until ${featuredUntil!.toLocaleDateString()}. It appears at the top of search results.`
                      : isExpired
                        ? 'Your featuring has expired. Renew to stay at the top.'
                        : 'Get a prominent placement at the top of search results and the homepage.'}
                  </p>
                  {!isFeaturedActive && (
                    <div className="flex flex-wrap gap-2">
                      {[{ days: 7, price: 19 }, { days: 14, price: 35 }, { days: 30, price: 59 }].map(opt => (
                        <a
                          key={opt.days}
                          href={`/api/owner/feature?days=${opt.days}`}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
                        >
                          {opt.days} days — ${opt.price}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {isFeaturedActive && (
                  <span className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">⭐ Featured</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Premium Subscription */}
        <div className="bg-gradient-to-br from-[#1A3C5E] to-[#0E7C7B] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-bold text-white mb-1">🚀 Upgrade to Premium</h2>
              <p className="text-sm text-white/70 mb-3">
                Get featured on homepage, priority search ranking, flash deals, and more with a premium subscription.
              </p>
              <Link
                href="/owner/upgrade"
                className="inline-block px-4 py-2 rounded-xl text-sm font-bold bg-white text-[#1A3C5E] hover:bg-gray-100 transition-colors"
              >
                View Plans & Pricing
              </Link>
            </div>
            <div className="text-3xl">💎</div>
          </div>
        </div>

        {/* ── Boost & Promote section ── */}
        {(() => {
          const sub = (hotel as any).subscription;
          const tier = sub?.tier;
          const promoAllowed = tier?.promotionalEmails ?? 0;
          const promoUsed = sub?.promoEmailsUsed ?? 0;
          const promoLeft = Math.max(0, promoAllowed - promoUsed);
          const flashAllowed = tier?.flashDealsPerMonth ?? 0;
          const flashUsed = sub?.flashDealsUsed ?? 0;
          const flashLeft = Math.max(0, flashAllowed - flashUsed);
          const hasPromo = promoAllowed > 0;
          const hasFlash = flashAllowed > 0;

          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">🚀 Boost & Promote</h2>
                {!hasPromo && !hasFlash && (
                  <Link href="/owner/upgrade" className="text-xs font-bold text-teal-600 hover:underline">Upgrade to unlock →</Link>
                )}
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">

                {/* Promo Email */}
                <div className={`rounded-xl border p-4 ${hasPromo ? 'border-teal-200 bg-teal-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📧</span>
                    <span className="font-bold text-sm text-gray-800">Email Campaign</span>
                    {hasPromo && (
                      <span className="ml-auto text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                        {promoLeft >= 999 ? '∞' : promoLeft} left
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    {hasPromo
                      ? `Send a promotional email about ${hotel.name} to all active BusyBeds subscribers.`
                      : 'Upgrade to Growth or Premium to send promo emails to BusyBeds subscribers.'}
                  </p>
                  {hasPromo ? (
                    promoLeft > 0 ? (
                      <Link href={`/owner/promo-email`}
                        className="inline-block px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #0E7C7B, #1A3C5E)' }}>
                        Send Campaign →
                      </Link>
                    ) : (
                      <span className="inline-block px-4 py-2 rounded-lg text-xs font-bold bg-gray-200 text-gray-500 cursor-not-allowed">
                        Limit reached this month
                      </span>
                    )
                  ) : (
                    <Link href="/owner/upgrade"
                      className="inline-block px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                      Upgrade Plan
                    </Link>
                  )}
                </div>

                {/* Flash Deal */}
                <div className={`rounded-xl border p-4 ${hasFlash ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚡</span>
                    <span className="font-bold text-sm text-gray-800">Flash Deal</span>
                    {hasFlash && (
                      <span className="ml-auto text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        {flashLeft >= 999 ? '∞' : flashLeft} left
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    {hasFlash
                      ? `Create a time-limited flash deal for ${hotel.name}. Shown prominently on the BusyBeds homepage.`
                      : 'Upgrade your plan to create flash deals and get featured on the BusyBeds homepage.'}
                  </p>
                  {hasFlash ? (
                    flashLeft > 0 ? (
                      <Link href={`/portal/manage`}
                        className="inline-block px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}>
                        Create Flash Deal →
                      </Link>
                    ) : (
                      <span className="inline-block px-4 py-2 rounded-lg text-xs font-bold bg-gray-200 text-gray-500 cursor-not-allowed">
                        Limit reached this month
                      </span>
                    )
                  ) : (
                    <Link href="/owner/upgrade"
                      className="inline-block px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                      Upgrade Plan
                    </Link>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

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
