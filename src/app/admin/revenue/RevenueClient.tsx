'use client';
import { useState, useEffect } from 'react';

interface RevenueData {
  mrr: number; arr: number; activeSubscriptions: number;
  totalUsers: number; newUsersThisMonth: number;
  totalHotels: number; pendingHotels: number; activeHotels: number;
  newsletterCount: number; referralCount: number; couponsThisMonth: number;
  byPlan: Record<string, { count: number; revenue: number }>;
  monthlyGrowth: Array<{ month: string; count: number }>;
}

export default function RevenueClient() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
    </div>
  );
  if (!data) return <div className="text-center py-20 text-gray-400">Failed to load revenue data</div>;

  const maxGrowth = Math.max(...(data.monthlyGrowth.map(m => m.count) || [1]), 1);

  const kpis = [
    { label: 'MRR', value: `$${data.mrr.toLocaleString()}`, icon: '💵', color: 'text-green-500', sub: `$${data.arr.toLocaleString()} ARR` },
    { label: 'Active Subscriptions', value: data.activeSubscriptions, icon: '💳', color: 'text-blue-500', sub: 'paying customers' },
    { label: 'Total Users', value: data.totalUsers.toLocaleString(), icon: '👤', color: 'text-purple-500', sub: `+${data.newUsersThisMonth} this month` },
    { label: 'Active Hotels', value: data.activeHotels, icon: '🏨', color: 'text-pink-500', sub: `${data.pendingHotels} pending review` },
    { label: 'Coupon Scans', value: data.couponsThisMonth.toLocaleString(), icon: '🎫', color: 'text-orange-500', sub: 'this month' },
    { label: 'Newsletter Subs', value: data.newsletterCount.toLocaleString(), icon: '📧', color: 'text-cyan-500', sub: 'email subscribers' },
    { label: 'Referrals', value: data.referralCount.toLocaleString(), icon: '👥', color: 'text-yellow-500', sub: 'successful referrals' },
    { label: 'Total Hotels', value: data.totalHotels, icon: '🗺️', color: 'text-indigo-500', sub: 'all time' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">{kpi.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subscriptions by plan */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue by Plan</h2>
          {Object.keys(data.byPlan).length === 0 ? (
            <p className="text-gray-400 text-sm">No active subscriptions yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.byPlan).map(([plan, stats]) => (
                <div key={plan} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{plan}</p>
                    <p className="text-xs text-gray-400">{stats.count} subscribers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">${stats.revenue.toLocaleString()}/mo</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly subscription growth */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">New Subscriptions — Last 6 Months</h2>
          <div className="flex items-end gap-2 h-24">
            {data.monthlyGrowth.map(({ month, count }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-[#FF385C] to-[#ff6b85] min-h-[2px] transition-all"
                  style={{ height: `${maxGrowth > 0 ? (count / maxGrowth) * 100 : 0}%` }}
                />
                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                  {month}: {count} new
                </div>
                <span className="text-[10px] text-gray-400">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
