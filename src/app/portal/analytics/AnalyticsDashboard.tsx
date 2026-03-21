'use client';
import { useState, useEffect } from 'react';

interface HotelStat {
  id: string; name: string; slug: string; discountPercent: number;
  status: string; scans: number; totalViews: number;
  conversionRate: number; estimatedRevenue: number; basePrice: number;
}
interface Summary {
  totalScans: number; totalViews: number; totalHotels: number;
  estimatedRevenue: number; avgConversion: string;
}
interface DailyPoint { date: string; count: number; }

export default function AnalyticsDashboard() {
  const [data, setData] = useState<{ hotels: HotelStat[]; summary: Summary; dailyScans: DailyPoint[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/portal/analytics?days=${days}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const exportCSV = () => {
    if (!data?.hotels) return;
    const rows = [
      ['Hotel', 'Status', 'Discount', 'Views', 'Coupon Scans', 'Conversion %', 'Est. Revenue (USD)'],
      ...data.hotels.map(h => [
        h.name, h.status, `${h.discountPercent}%`, h.totalViews,
        h.scans, `${h.conversionRate}%`, `$${h.estimatedRevenue}`
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `busybeds-analytics-${days}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
    </div>
  );

  const s = data?.summary;
  const maxScans = Math.max(...(data?.dailyScans.map(d => d.count) || [1]), 1);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <div className="flex items-center gap-3">
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={exportCSV}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Coupon Scans', value: s?.totalScans ?? 0, icon: '🎫', color: 'text-pink-500' },
          { label: 'Total Page Views', value: s?.totalViews ?? 0, icon: '👁️', color: 'text-blue-500' },
          { label: 'Avg Conversion', value: `${s?.avgConversion ?? 0}%`, icon: '📈', color: 'text-green-500' },
          { label: 'Est. Revenue', value: `$${(s?.estimatedRevenue ?? 0).toLocaleString()}`, icon: '💰', color: 'text-yellow-500' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Daily scan chart */}
      {data?.dailyScans && data.dailyScans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Coupon Scans — Last {days} days</h2>
          <div className="flex items-end gap-1 h-32">
            {data.dailyScans.map(({ date, count }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-[#FF385C] to-[#ff6b85] transition-all duration-300 hover:opacity-80"
                  style={{ height: `${maxScans > 0 ? (count / maxScans) * 100 : 0}%`, minHeight: count > 0 ? '4px' : '0' }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                  {new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}: {count} scans
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{data.dailyScans[0]?.date ? new Date(data.dailyScans[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Per-hotel table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Hotel Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750 text-left">
                {['Hotel', 'Status', 'Discount', 'Views', 'Scans', 'Conversion', 'Est. Revenue'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {(data?.hotels || []).map(hotel => (
                <tr key={hotel.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/hotels/${hotel.slug}`} target="_blank" className="font-medium text-gray-900 dark:text-white hover:text-[#FF385C] transition-colors">
                      {hotel.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      hotel.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{hotel.status}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-pink-500">{hotel.discountPercent}%</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{hotel.totalViews.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{hotel.scans}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden" style={{ width: 40 }}>
                        <div className="h-full bg-[#FF385C] rounded-full" style={{ width: `${Math.min(hotel.conversionRate * 10, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{hotel.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-semibold">${hotel.estimatedRevenue.toLocaleString()}</td>
                </tr>
              ))}
              {(data?.hotels || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No hotels found. Add hotels to see analytics.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
