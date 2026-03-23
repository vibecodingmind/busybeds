'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center">Error loading analytics</div>;

  const s = data.summary;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-500">Last 30 days performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: s.totalUsers, icon: '👥' },
          { label: 'Active Hotels', value: s.totalHotels, icon: '🏨' },
          { label: 'Coupons Generated', value: s.totalCoupons, icon: '🎫' },
          { label: 'Coupons Redeemed', value: s.couponsRedeemed, icon: '✅' },
        ].map((st, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">{st.icon}</div>
            <div className="text-sm text-gray-500 mb-1">{st.label}</div>
            <div className="text-2xl font-bold">{typeof st.value === 'number' ? st.value.toLocaleString() : st.value}</div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 mb-2">Redemption Rate</div>
          <div className="text-3xl font-bold text-green-600">{s.redemptionRate}%</div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(s.redemptionRate, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 mb-2">Total Revenue (30 days)</div>
          <div className="text-3xl font-bold text-blue-600">${s.revenue.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-2">From subscriptions & featured hotels</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: '👥' },
          { href: '/admin/hotels', label: 'Manage Hotels', icon: '🏨' },
          { href: '/admin/referral-payouts', label: 'Referral Payouts', icon: '💰' },
        ].map((link, i) => (
          <Link key={i} href={link.href} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors flex items-center gap-4">
            <div className="text-3xl">{link.icon}</div>
            <div>
              <div className="font-semibold">{link.label}</div>
              <div className="text-xs text-gray-500">Manage →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
