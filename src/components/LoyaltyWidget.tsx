'use client';
import { useState, useEffect } from 'react';

interface PointsData {
  points: number;
  lifetime: number;
  transactions: Array<{ points: number; type: string; description: string; createdAt: string }>;
}

export default function LoyaltyWidget() {
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/loyalty')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />;

  const pts = data?.points ?? 0;
  const tier = pts >= 5000 ? 'Gold' : pts >= 1000 ? 'Silver' : 'Bronze';
  const tierColor = tier === 'Gold' ? 'text-yellow-600' : tier === 'Silver' ? 'text-gray-400' : 'text-orange-600';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Loyalty Points</h3>
          <p className={`text-sm font-semibold ${tierColor}`}>{tier} Member</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#FF385C]">{pts.toLocaleString()}</p>
          <p className="text-xs text-gray-500">available points</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {tier !== 'Gold' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{tier}</span>
            <span>{tier === 'Bronze' ? `${1000 - pts} to Silver` : `${5000 - pts} to Gold`}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF385C] to-[#BD1E59] rounded-full transition-all"
              style={{ width: `${Math.min(100, tier === 'Bronze' ? (pts / 1000) * 100 : ((pts - 1000) / 4000) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {data?.transactions && data.transactions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</p>
          {data.transactions.slice(0, 3).map((tx, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{tx.description}</span>
              <span className={`font-semibold flex-shrink-0 ml-2 ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.points > 0 ? '+' : ''}{tx.points} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
