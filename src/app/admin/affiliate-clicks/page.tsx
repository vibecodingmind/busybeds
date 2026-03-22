'use client';
import { useState, useEffect } from 'react';

interface ClickRow { hotelId: string; hotelName: string; platform: string; clicks: number }

export default function AffiliateClicksPage() {
  const [data, setData] = useState<{ total: number; clicks: ClickRow[]; days: number } | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = async (d: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/affiliate-clicks?days=${d}`).then(r => r.json());
    setData(res);
    setLoading(false);
  };

  useEffect(() => { load(days); }, []);

  const handleDaysChange = (d: number) => { setDays(d); load(d); };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🔗 Affiliate Click Report</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => handleDaysChange(d)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${days === d ? 'bg-[#0E7C7B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : !data || data.clicks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-500">No affiliate clicks recorded in the last {days} days.</p>
          <p className="text-gray-400 text-sm mt-1">Clicks will appear when subscribers access partner booking links.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
            <p className="text-sm text-gray-500">Total clicks in last {days} days</p>
            <p className="text-4xl font-bold text-[#1A3C5E]">{data.total.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Hotel</th>
                  <th className="px-4 py-3 text-left">Platform</th>
                  <th className="px-4 py-3 text-left">Clicks</th>
                  <th className="px-4 py-3 text-left">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.clicks.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.hotelName}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{row.platform.replace(/_/g, '.')}</td>
                    <td className="px-4 py-3 font-bold">{row.clicks}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-[#0E7C7B] flex-shrink-0"
                          style={{ width: `${Math.max(8, (row.clicks / (data.clicks[0].clicks || 1)) * 80)}px` }} />
                        <span className="text-xs text-gray-400">
                          {((row.clicks / (data.total || 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
