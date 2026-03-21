'use client';
import { useState, useEffect } from 'react';

interface MonthlyTrend {
  month: string;
  newSubs: number;
  cancelledSubs: number;
  newUsers: number;
  couponsGenerated: number;
  couponsRedeemed: number;
}

interface RevenueData {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  totalUsers: number;
  newUsersThisMonth: number;
  totalHotels: number;
  pendingHotels: number;
  activeHotels: number;
  newsletterCount: number;
  referralCount: number;
  totalCoupons: number;
  redeemedCoupons: number;
  priceAlertCount: number;
  couponRedemptionRate: number;
  byPlan: Record<string, { count: number; revenue: number; color: string }>;
  monthlyTrends: MonthlyTrend[];
  topHotels: Array<{ name: string; count: number }>;
  churnRate: number;
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({
  data,
  series,
  height = 160,
}: {
  data: MonthlyTrend[];
  series: Array<{ key: keyof MonthlyTrend; color: string; label: string }>;
  height?: number;
}) {
  const W = 600;
  const H = height;
  const PAD = { top: 12, right: 16, bottom: 28, left: 40 };

  const allVals = series.flatMap(s => data.map(d => Number(d[s.key])));
  const maxVal = Math.max(...allVals, 1);

  const xStep = (W - PAD.left - PAD.right) / Math.max(data.length - 1, 1);
  const yScale = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / maxVal);
  const xPos = (i: number) => PAD.left + i * xStep;

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal * i) / yTicks));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {yTickVals.map(val => {
        const y = yScale(val);
        return (
          <g key={val}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
              stroke="#f3f4f6" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">{val}</text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => (
        i % Math.ceil(data.length / 6) === 0 && (
          <text key={d.month} x={xPos(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {d.month}
          </text>
        )
      ))}

      {/* Series */}
      {series.map(s => {
        const pts = data.map((d, i) => `${xPos(i)},${yScale(Number(d[s.key]))}`).join(' ');
        const areaBase = H - PAD.bottom;
        const areaPath = `M${xPos(0)},${areaBase} ` +
          data.map((d, i) => `L${xPos(i)},${yScale(Number(d[s.key]))}`).join(' ') +
          ` L${xPos(data.length - 1)},${areaBase} Z`;

        return (
          <g key={s.key as string}>
            <path d={areaPath} fill={s.color} fillOpacity={0.08} />
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d, i) => {
              const val = Number(d[s.key]);
              return (
                <circle key={i} cx={xPos(i)} cy={yScale(val)} r={3}
                  fill={s.color} stroke="white" strokeWidth={1.5}>
                  <title>{d.month}: {val}</title>
                </circle>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({
  data,
  valueKey,
  labelKey,
  color = '#FF385C',
  height = 140,
}: {
  data: Array<Record<string, any>>;
  valueKey: string;
  labelKey: string;
  color?: string;
  height?: number;
}) {
  const W = 600;
  const H = height;
  const PAD = { top: 10, right: 12, bottom: 28, left: 32 };

  const maxVal = Math.max(...data.map(d => Number(d[valueKey])), 1);
  const barW = (W - PAD.left - PAD.right) / data.length - 4;
  const xStep = (W - PAD.left - PAD.right) / data.length;
  const yScale = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / maxVal);

  const yTicks = 3;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal * i) / yTicks));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {yTickVals.map(val => (
        <g key={val}>
          <line x1={PAD.left} x2={W - PAD.right} y1={yScale(val)} y2={yScale(val)} stroke="#f3f4f6" strokeWidth={1} />
          <text x={PAD.left - 4} y={yScale(val) + 3} textAnchor="end" fontSize={9} fill="#9ca3af">{val}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const x = PAD.left + i * xStep + 2;
        const barHeight = Math.max((H - PAD.top - PAD.bottom) - (yScale(val) - PAD.top), 1);
        return (
          <g key={i}>
            <rect x={x} y={yScale(val)} width={barW} height={barHeight}
              fill={color} rx={3} opacity={0.85}>
              <title>{d[labelKey]}: {val}</title>
            </rect>
            {data.length <= 12 && (
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
                {String(d[labelKey]).substring(0, 6)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 120 }: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 8;
  const r = R * 0.55;

  let angle = -Math.PI / 2;
  const paths = segments.map(seg => {
    const fraction = seg.value / total;
    const startAngle = angle;
    angle += fraction * 2 * Math.PI;
    const endAngle = angle;
    const largeArc = fraction > 0.5 ? 1 : 0;

    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const ix1 = cx + r * Math.cos(startAngle);
    const iy1 = cy + r * Math.sin(startAngle);
    const ix2 = cx + r * Math.cos(endAngle);
    const iy2 = cy + r * Math.sin(endAngle);

    const d = [
      `M${x1.toFixed(2)},${y1.toFixed(2)}`,
      `A${R},${R} 0 ${largeArc},1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
      `L${ix2.toFixed(2)},${iy2.toFixed(2)}`,
      `A${r},${r} 0 ${largeArc},0 ${ix1.toFixed(2)},${iy1.toFixed(2)}`,
      'Z',
    ].join(' ');

    return { d, color: seg.color, label: seg.label, pct: Math.round(fraction * 100) };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth={1.5}>
            <title>{p.label}: {segments[i].value} ({p.pct}%)</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={13} fontWeight="700" fill="#1D2939">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#9ca3af">total</text>
      </svg>
      <div className="space-y-1.5 min-w-0">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-gray-600 truncate">{seg.label}</span>
            <span className="font-semibold text-gray-900 ml-auto pl-2">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="flex flex-wrap gap-3 mb-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function RevenueClient() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'hotels' | 'engagement'>('overview');

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mb-3">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="font-medium">Failed to load revenue data</p>
      </div>
    );
  }

  const planEntries = Object.entries(data.byPlan);
  const totalPlanRevenue = planEntries.reduce((s, [, v]) => s + v.revenue, 0);

  // Tabs
  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'subscriptions' as const, label: 'Subscriptions' },
    { id: 'hotels' as const, label: 'Hotels & Coupons' },
    { id: 'engagement' as const, label: 'Engagement' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
            style={activeTab === tab.id
              ? { background: '#fff', color: '#1A3C5E', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
              : { color: '#6B7280' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
              label="Monthly Recurring Revenue"
              value={`$${data.mrr.toLocaleString()}`}
              sub={`$${data.arr.toLocaleString()} ARR`}
              accent="#10B981"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
              label="Active Subscriptions"
              value={data.activeSubscriptions.toLocaleString()}
              sub={`${data.churnRate}% churn (3 mo)`}
              accent="#3B82F6"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
              label="Total Users"
              value={data.totalUsers.toLocaleString()}
              sub={`+${data.newUsersThisMonth} this month`}
              accent="#8B5CF6"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
              label="Coupon Redemptions"
              value={data.redeemedCoupons.toLocaleString()}
              sub={`${data.couponRedemptionRate}% redemption rate`}
              accent="#FF385C"
            />
          </div>

          {/* Monthly Trends Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Growth Trends — Last 12 Months" sub="New subscriptions, users and coupons generated" />
            <Legend items={[
              { label: 'New Subs', color: '#0E7C7B' },
              { label: 'New Users', color: '#8B5CF6' },
              { label: 'Coupons Generated', color: '#FF385C' },
            ]} />
            <LineChart
              data={data.monthlyTrends}
              series={[
                { key: 'newSubs', color: '#0E7C7B', label: 'New Subs' },
                { key: 'newUsers', color: '#8B5CF6', label: 'New Users' },
                { key: 'couponsGenerated', color: '#FF385C', label: 'Coupons Generated' },
              ]}
              height={180}
            />
          </div>

          {/* Plan breakdown + Top hotels */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <SectionHeader title="Revenue by Plan" sub="Active subscriber distribution" />
              {planEntries.length === 0 ? (
                <p className="text-gray-400 text-sm">No active subscriptions yet</p>
              ) : (
                <DonutChart
                  segments={planEntries.map(([name, v]) => ({ label: name, value: v.count, color: v.color }))}
                  size={130}
                />
              )}
              {planEntries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {planEntries.map(([name, v]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
                        <span className="text-gray-600">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{v.count} sub{v.count !== 1 ? 's' : ''}</span>
                        <span className="font-semibold text-green-600 text-xs">
                          ${v.revenue.toFixed(0)}/mo
                          {totalPlanRevenue > 0 && ` (${Math.round((v.revenue / totalPlanRevenue) * 100)}%)`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <SectionHeader title="Top Hotels by Coupons" sub="Most popular hotels this month" />
              {data.topHotels.length === 0 ? (
                <p className="text-gray-400 text-sm">No coupon data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topHotels.map((hotel, i) => {
                    const maxCount = data.topHotels[0]?.count || 1;
                    const pct = Math.round((hotel.count / maxCount) * 100);
                    const colors = ['#FF385C', '#0E7C7B', '#1A3C5E', '#F59E0B', '#8B5CF6'];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-700 font-medium truncate flex-1 mr-2">{hotel.name}</span>
                          <span className="text-gray-500">{hotel.count} coupons</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ─────────────────────────────────────────────── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              label="MRR" value={`$${data.mrr.toLocaleString()}`} sub={`$${data.arr.toLocaleString()} ARR`} accent="#10B981"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
              label="Active Subs" value={data.activeSubscriptions} sub="paying today" accent="#3B82F6"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
              label="Churn Rate (3 mo)" value={`${data.churnRate}%`} sub="cancellations / new starts" accent="#EF4444"
            />
          </div>

          {/* New vs Cancelled */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="New vs. Cancelled Subscriptions" sub="12-month comparison" />
            <Legend items={[
              { label: 'New Subscriptions', color: '#0E7C7B' },
              { label: 'Cancellations', color: '#EF4444' },
            ]} />
            <LineChart
              data={data.monthlyTrends}
              series={[
                { key: 'newSubs', color: '#0E7C7B', label: 'New' },
                { key: 'cancelledSubs', color: '#EF4444', label: 'Cancelled' },
              ]}
              height={200}
            />
          </div>

          {/* Plan detail */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Plan Revenue Breakdown" />
            {planEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">No active subscriptions yet</p>
            ) : (
              <div className="space-y-4">
                {planEntries.map(([name, v]) => (
                  <div key={name} className="p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: v.color }} />
                        <span className="font-semibold text-gray-900">{name}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">${v.revenue.toFixed(0)}/mo</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{v.count} subscriber{v.count !== 1 ? 's' : ''}</span>
                      {totalPlanRevenue > 0 && (
                        <span>{Math.round((v.revenue / totalPlanRevenue) * 100)}% of MRR</span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${totalPlanRevenue > 0 ? (v.revenue / totalPlanRevenue) * 100 : 0}%`, background: v.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HOTELS & COUPONS ──────────────────────────────────────────── */}
      {activeTab === 'hotels' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E7C7B" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              label="Active Hotels" value={data.activeHotels} sub={`${data.pendingHotels} pending review`} accent="#0E7C7B"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={2}><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>}
              label="Total Coupons" value={data.totalCoupons.toLocaleString()} sub={`${data.redeemedCoupons} redeemed`} accent="#FF385C"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              label="Redemption Rate" value={`${data.couponRedemptionRate}%`} sub="of all coupons" accent="#F59E0B"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A3C5E" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              label="Total Hotels" value={data.totalHotels} sub="all time" accent="#1A3C5E"
            />
          </div>

          {/* Coupon trend chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Coupon Activity — Last 12 Months" sub="Coupons generated vs. redeemed at hotels" />
            <Legend items={[
              { label: 'Generated', color: '#FF385C' },
              { label: 'Redeemed', color: '#10B981' },
            ]} />
            <LineChart
              data={data.monthlyTrends}
              series={[
                { key: 'couponsGenerated', color: '#FF385C', label: 'Generated' },
                { key: 'couponsRedeemed', color: '#10B981', label: 'Redeemed' },
              ]}
              height={200}
            />
          </div>

          {/* Top hotels bar chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Top Hotels by Coupon Volume" sub="All-time leaders" />
            {data.topHotels.length === 0 ? (
              <p className="text-gray-400 text-sm">No coupon data yet</p>
            ) : (
              <div className="space-y-3">
                {data.topHotels.map((hotel, i) => {
                  const maxCount = data.topHotels[0]?.count || 1;
                  const pct = Math.round((hotel.count / maxCount) * 100);
                  const colors = ['#FF385C', '#0E7C7B', '#1A3C5E', '#F59E0B', '#8B5CF6'];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-700 font-medium truncate">{hotel.name}</span>
                          <span className="font-bold text-gray-900 ml-2">{hotel.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ENGAGEMENT ────────────────────────────────────────────────── */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
              label="Total Users" value={data.totalUsers.toLocaleString()} sub={`+${data.newUsersThisMonth} this month`} accent="#8B5CF6"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E7C7B" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              label="Newsletter Subscribers" value={data.newsletterCount.toLocaleString()} sub="email subscribers" accent="#0E7C7B"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
              label="Referrals" value={data.referralCount.toLocaleString()} sub="successful referrals" accent="#F59E0B"
            />
            <StatCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>}
              label="Active Price Alerts" value={data.priceAlertCount.toLocaleString()} sub="watching for deals" accent="#EF4444"
            />
          </div>

          {/* User growth bar chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="User Registrations — Last 12 Months" />
            <BarChart
              data={data.monthlyTrends}
              valueKey="newUsers"
              labelKey="month"
              color="#8B5CF6"
              height={160}
            />
          </div>

          {/* Engagement overview */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <SectionHeader title="Engagement Summary" />
              <div className="space-y-3">
                {[
                  { label: 'Newsletter open rate', value: '—', note: 'via email provider' },
                  { label: 'Avg coupons per subscriber', value: data.activeSubscriptions > 0 ? (data.totalCoupons / data.activeSubscriptions).toFixed(1) : '0', note: 'all time' },
                  { label: 'Referral conversion', value: data.referralCount > 0 ? `${Math.round((data.referralCount / data.totalUsers) * 100)}%` : '0%', note: 'of users' },
                  { label: 'Hotel fill rate', value: `${Math.round((data.activeHotels / Math.max(data.totalHotels, 1)) * 100)}%`, note: 'active vs. total' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <SectionHeader title="Platform Health" />
              <div className="space-y-4">
                {[
                  { label: 'Subscription health', value: data.churnRate < 10 ? 'Good' : data.churnRate < 25 ? 'Fair' : 'Needs attention', color: data.churnRate < 10 ? '#10B981' : data.churnRate < 25 ? '#F59E0B' : '#EF4444', note: `${data.churnRate}% churn` },
                  { label: 'Hotel network', value: data.pendingHotels === 0 ? 'All clear' : `${data.pendingHotels} pending`, color: data.pendingHotels === 0 ? '#10B981' : '#F59E0B', note: `${data.activeHotels} active` },
                  { label: 'Coupon redemption', value: data.couponRedemptionRate > 30 ? 'Strong' : data.couponRedemptionRate > 10 ? 'Average' : 'Low', color: data.couponRedemptionRate > 30 ? '#10B981' : data.couponRedemptionRate > 10 ? '#F59E0B' : '#EF4444', note: `${data.couponRedemptionRate}% rate` },
                  { label: 'User growth', value: data.newUsersThisMonth > 10 ? 'Growing' : data.newUsersThisMonth > 0 ? 'Slow' : 'Stalled', color: data.newUsersThisMonth > 10 ? '#10B981' : data.newUsersThisMonth > 0 ? '#F59E0B' : '#EF4444', note: `+${data.newUsersThisMonth} this month` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{item.note}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${item.color}18`, color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
