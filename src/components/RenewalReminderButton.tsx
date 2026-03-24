'use client';
import { useState } from 'react';

export default function RenewalReminderButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null);

  const trigger = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/send-reminders', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setResult({ error: data.error || 'Failed' });
      else setResult({ sent: data.sent?.length ?? 0 });
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between gap-4">
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">🔄 Subscription Renewal Reminders</h3>
        <p className="text-xs text-gray-400 mt-0.5">Send email reminders to users whose subscriptions expire in the next 3 days</p>
        {result && (
          <p className={`text-xs mt-1 font-medium ${result.error ? 'text-red-600' : 'text-green-600'}`}>
            {result.error ? `Error: ${result.error}` : `✓ Sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>
      <button onClick={trigger} disabled={loading}
        className="flex-shrink-0 bg-[#1A3C5E] hover:bg-[#142e4a] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
        {loading ? 'Sending…' : 'Send Reminders'}
      </button>
    </div>
  );
}
