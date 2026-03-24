'use client';
import { useState, useEffect } from 'react';

interface Flag { id: string; fullName: string; email: string; couponCount: number; risk: string; isBanned: boolean; }
interface BannedUser { id: string; fullName: string; email: string; createdAt: string; }

export default function FraudClient() {
  const [data, setData] = useState<{ flags: Flag[]; bannedUsers: BannedUser[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/fraud')
      .then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const banUser = async (userId: string) => {
    setBanning(userId);
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'ban' }),
      });
      setData(prev => prev ? {
        ...prev,
        flags: prev.flags.map(f => f.id === userId ? { ...f, isBanned: true } : f),
      } : null);
    } catch {}
    setBanning(null);
  };

  const riskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-orange-100 text-orange-700',
      low: 'bg-yellow-100 text-yellow-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[risk]}`}>⚠ {risk} risk</span>;
  };

  if (loading) return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-8">
      {/* Suspicious users */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Suspicious Activity
          {data?.flags.length ? <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">{data.flags.length} flagged</span> : null}
        </h2>
        {!data?.flags.length ? (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-green-700 dark:text-green-300 font-medium">No suspicious activity detected</p>
            <p className="text-green-600 dark:text-green-400 text-sm mt-1">All users within normal usage patterns</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-left">
                  {['User', 'Coupons (7d)', 'Risk Level', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {data.flags.map(flag => (
                  <tr key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{flag.fullName}</div>
                      <div className="text-xs text-gray-400">{flag.email}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{flag.couponCount}</td>
                    <td className="px-4 py-3">{riskBadge(flag.risk)}</td>
                    <td className="px-4 py-3">
                      {flag.isBanned
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Banned</span>
                        : <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">Active</span>}
                    </td>
                    <td className="px-4 py-3">
                      {!flag.isBanned && (
                        <button onClick={() => banUser(flag.id)} disabled={banning === flag.id}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                          {banning === flag.id ? 'Banning…' : 'Ban User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Banned users list */}
      {data?.bannedUsers && data.bannedUsers.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Banned Users ({data.bannedUsers.length})</h2>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-50 dark:divide-gray-700">
            {data.bannedUsers.map(user => (
              <div key={user.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
