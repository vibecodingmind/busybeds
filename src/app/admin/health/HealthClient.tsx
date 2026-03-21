'use client';
import { useState, useEffect } from 'react';

interface HealthData {
  status: string; dbStatus: string; dbLatency: number; responseTime: number;
  recentlyActiveUsers: number; envChecks: Record<string, boolean>;
  nodeVersion: string; timestamp: string;
}

export default function HealthClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = () => {
    setLoading(true);
    fetch('/api/admin/health')
      .then(r => r.json())
      .then(d => { setData(d); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const statusDot = (ok: boolean) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
  );

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <div className={`rounded-2xl p-6 flex items-center gap-4 ${data?.status === 'operational' ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${data?.status === 'operational' ? 'bg-green-100' : 'bg-red-100'}`}>
          {loading ? '⟳' : data?.status === 'operational' ? '✅' : '⚠️'}
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg">
            {loading ? 'Checking...' : data?.status === 'operational' ? 'All Systems Operational' : 'System Degraded'}
          </p>
          <p className="text-sm text-gray-500">Last checked: {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <button onClick={refresh} disabled={loading}
          className="ml-auto px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {data && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'DB Latency', value: `${data.dbLatency}ms`, ok: data.dbLatency < 200 },
              { label: 'Response Time', value: `${data.responseTime}ms`, ok: data.responseTime < 500 },
              { label: 'DB Status', value: data.dbStatus, ok: data.dbStatus === 'healthy' },
              { label: 'Active Users (24h)', value: data.recentlyActiveUsers, ok: true },
            ].map(m => (
              <div key={m.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">{statusDot(m.ok)}<span className="text-xs text-gray-500">{m.label}</span></div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Env checks */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Environment Variables</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(data.envChecks).map(([key, ok]) => (
                <div key={key} className="flex items-center gap-2">
                  {statusDot(ok)}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{key}</span>
                  {!ok && <span className="text-xs text-red-500 font-medium">MISSING</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center">Node {data.nodeVersion} · {data.timestamp}</div>
        </>
      )}
    </div>
  );
}
