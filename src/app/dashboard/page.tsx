import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import CouponCountdown from '@/components/CouponCountdown';
import ReferralWidget from '@/components/ReferralWidget';
import LoyaltyWidget from '@/components/LoyaltyWidget';
import PushSubscribeButton from '@/components/PushSubscribeButton';

async function getData(userId: string) {
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active', expiresAt: { gt: now } },
    include: { package: true },
    orderBy: { expiresAt: 'desc' },
  });
  const coupons = await prisma.coupon.findMany({
    where: { userId },
    include: { hotel: { select: { name: true, city: true, coverImage: true } } },
    orderBy: { generatedAt: 'desc' },
    take: 6,
  });
  const user        = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true, fullName: true } });
  const favCount    = await prisma.favorite.count({ where: { userId } });
  const activeCount = await prisma.coupon.count({ where: { userId, status: 'active', expiresAt: { gt: now } } });

  // Savings stats
  const redeemedCoupons = await prisma.coupon.findMany({
    where: { userId, status: 'redeemed' },
    select: { hotelId: true, discountPercent: true },
  });
  const totalRedeemed = redeemedCoupons.length;
  // Estimate savings: average room TSh 80,000
  const AVG_ROOM_TZS = 80000;
  const totalSavedTzs = redeemedCoupons.reduce((s, c) => s + (AVG_ROOM_TZS * c.discountPercent) / 100, 0);
  const hotelsVisited = new Set(redeemedCoupons.map(c => c.hotelId)).size;

  return { sub, coupons, user, favCount, activeCount, totalRedeemed, totalSavedTzs, hotelsVisited };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  active:    { label: 'Active',    cls: 'bg-green-50 text-green-700 border border-green-200',  dot: '#22C55E' },
  redeemed:  { label: 'Redeemed',  cls: 'bg-blue-50 text-blue-700 border border-blue-200',     dot: '#3B82F6' },
  expired:   { label: 'Expired',   cls: 'bg-gray-100 text-gray-500 border border-gray-200',    dot: '#9CA3AF' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border border-red-200',        dot: '#EF4444' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');

  const { sub, coupons, user, favCount, activeCount, totalRedeemed, totalSavedTzs, hotelsVisited } = await getData(session.userId);
  const firstName = session.fullName.split(' ')[0];
  const used = sub ? coupons.filter(c => c.subscriptionId === sub.id).length : 0;
  const limit = sub?.package.couponLimitPerPeriod ?? 0;
  const progress = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const daysLeft = sub
    ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  const initials = (user?.fullName || session.fullName)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />

      {/* ── Hero greeting banner ── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: 'white' }} />
        <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full opacity-[0.07]" style={{ background: 'white' }} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={firstName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white flex-shrink-0 border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
                  {initials}
                </div>
              )}
              <div>
                <p className="text-white/60 text-sm font-medium">{getGreeting()}</p>
                <h1 className="text-2xl font-extrabold text-white leading-tight">{firstName} 👋</h1>
                <p className="text-white/60 text-xs mt-0.5">
                  {activeCount > 0
                    ? `You have ${activeCount} active coupon${activeCount !== 1 ? 's' : ''} ready to use`
                    : 'Browse hotels to generate your first coupon'}
                </p>
              </div>
            </div>
            <Link href="/"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white flex-shrink-0 transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <span>🏨</span> Browse Hotels
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Savings banner (shown only if user has redeemed coupons) ── */}
        {totalRedeemed > 0 && (
          <div className="rounded-2xl p-5 flex flex-wrap gap-5 items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #0E7C7B 0%, #0a5c5b 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="text-4xl">💰</div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Your Total Savings with BusyBeds</p>
                <p className="text-white text-2xl font-extrabold">TSh {Math.round(totalSavedTzs).toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-0.5">Estimated from redeemed discounts</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-white text-2xl font-extrabold">{totalRedeemed}</p>
                <p className="text-white/60 text-xs">Coupons Used</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-white text-2xl font-extrabold">{hotelsVisited}</p>
                <p className="text-white/60 text-xs">Hotels Visited</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Subscription + Stats row ── */}
        {sub ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Plan card */}
            <div className="lg:col-span-2 rounded-2xl p-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" style={{ background: 'white' }} />
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active Plan
                  </span>
                  <h2 className="text-xl font-extrabold">{sub.package.name}</h2>
                  <p className="text-white/60 text-sm mt-0.5">
                    Expires {new Date(sub.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {daysLeft > 0 && <span className="ml-2 text-yellow-300 font-medium">· {daysLeft}d left</span>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white/60 text-xs mb-0.5">Coupons used</p>
                  <p className="text-3xl font-extrabold">
                    {used}<span className="text-lg text-white/50">/{limit}</span>
                  </p>
                </div>
              </div>
              <div className="mt-5 relative z-10">
                <div className="flex justify-between text-xs text-white/50 mb-1.5">
                  <span>{used} used</span>
                  <span>{limit - used} remaining</span>
                </div>
                <div className="h-2 rounded-full bg-white/20">
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${progress}%`, background: progress >= 90 ? '#FCA5A5' : progress >= 60 ? '#FCD34D' : '#4ADE80' }} />
                </div>
              </div>
            </div>

            {/* Stats mini-cards */}
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 shadow-sm flex-1">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg flex-shrink-0">🎫</div>
                <div>
                  <div className="text-2xl font-extrabold" style={{ color: '#1A3C5E' }}>{activeCount}</div>
                  <div className="text-xs text-gray-500">Active Coupons</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 shadow-sm flex-1">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-lg flex-shrink-0">❤️</div>
                <div>
                  <div className="text-2xl font-extrabold" style={{ color: '#1A3C5E' }}>{favCount}</div>
                  <div className="text-xs text-gray-500">Saved Hotels</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No subscription CTA */
          <div className="rounded-2xl overflow-hidden shadow-sm border border-[#E8395A]/20"
            style={{ background: 'linear-gradient(135deg, #fff5f7 0%, #fff 60%)' }}>
            <div className="p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="text-5xl flex-shrink-0">🎫</div>
                <div className="flex-1">
                  <h3 className="text-lg font-extrabold text-gray-900 mb-1">You&apos;re not subscribed yet</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-sm">
                    Pick a plan to unlock QR discount coupons at all partner hotels — show your phone, save instantly.
                  </p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Link href="/subscribe"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #E8395A, #c0284a)' }}>
                      🚀 Choose a Plan
                    </Link>
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                      Browse hotels first →
                    </Link>
                  </div>
                </div>
                <div className="hidden lg:flex flex-col gap-2 flex-shrink-0">
                  {['QR coupons at checkout', 'Up to 40% off room rates', 'Cancel anytime'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-green-500 font-bold">✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-8 py-3 border-t border-[#E8395A]/10 bg-[#E8395A]/5 text-xs text-[#E8395A] font-medium">
              ⚡ Subscribers save an average of TSh 24,000 per hotel stay
            </div>
          </div>
        )}

        {/* ── Change Plan / Invoice ── */}
        {sub && (
          <div className="flex flex-wrap gap-3">
            <Link href="/subscribe?upgrade=1"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[#0E7C7B] text-[#0E7C7B] hover:bg-[#0E7C7B] hover:text-white transition-colors">
              ↕ Change Plan
            </Link>
            <Link href={`/invoices/${sub.id}`} target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
              🧾 Download Invoice
            </Link>
          </div>
        )}

        {/* ── Referral & Loyalty Widgets ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReferralWidget />
          <LoyaltyWidget />
        </div>

        {/* ── Quick actions ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-0.5">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/',                 icon: '🏨', label: 'Browse Hotels',  sub: 'Find deals',       bg: 'bg-blue-50',   ring: '#BFDBFE' },
              { href: '/coupons',          icon: '🎫', label: 'My Coupons',    sub: `${activeCount} active`, bg: 'bg-yellow-50', ring: '#FDE68A' },
              { href: '/my-stay-requests', icon: '📅', label: 'Stay Requests', sub: 'Extended stays',   bg: 'bg-violet-50', ring: '#DDD6FE' },
              { href: '/referral',         icon: '🎁', label: 'Refer & Earn',  sub: 'Earn bonus days',  bg: 'bg-green-50',  ring: '#BBF7D0' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="bg-white rounded-2xl p-4 flex flex-col items-center text-center border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm group">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="font-bold text-sm text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent Coupons ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Recent Coupons</h2>
            {coupons.length > 0 && (
              <Link href="/coupons" className="text-xs font-semibold hover:underline" style={{ color: '#0E7C7B' }}>
                View all →
              </Link>
            )}
          </div>
          {coupons.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-5xl mb-3">🏨</div>
              <h3 className="font-bold text-gray-900 mb-1">No coupons yet</h3>
              <p className="text-sm text-gray-500 mb-4">Browse hotels and get your first discount coupon</p>
              <Link href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#0E7C7B' }}>
                Browse Hotels
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {coupons.map(c => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.expired;
                return (
                  <Link key={c.id} href="/coupons"
                    className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    {c.hotel.coverImage ? (
                      <img src={c.hotel.coverImage} alt={c.hotel.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">🏨</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{c.hotel.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {c.hotel.city} · <span className="font-semibold text-teal-600">{c.discountPercent}% off</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.status === 'active' && (
                        <CouponCountdown expiresAt={c.expiresAt.toISOString()} status={c.status} />
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: cfg.dot, verticalAlign: 'middle' }} />
                        {cfg.label}
                      </span>
                    </div>
                    <svg className="text-gray-300 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Push notifications opt-in ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl flex-shrink-0">🔔</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900">Push Notifications</div>
            <div className="text-xs text-gray-400 mt-0.5">Get alerts for flash sales, coupon expiry, and new deals</div>
          </div>
          <PushSubscribeButton />
        </div>

        {/* ── Account settings ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">⚙️</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900">Account Settings</div>
            <div className="text-xs text-gray-400 mt-0.5">Update profile, password, and subscription</div>
          </div>
          <Link href="/profile"
            className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-gray-800 transition-colors">
            Manage
          </Link>
        </div>

      </div>
    </div>
  );
}
