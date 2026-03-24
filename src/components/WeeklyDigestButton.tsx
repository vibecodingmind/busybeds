'use client';
import { useState } from 'react';

export default function WeeklyDigestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const send = async () => {
    if (!window.confirm('Send weekly digest to all active subscribers?')) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/weekly-digest', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setResult(data);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        onClick={send}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
      >
        {loading
          ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Sending…</>
          : <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2} strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Send Weekly Digest</>
        }
      </button>
      {result && (
        <p className="text-xs text-green-600 font-medium">
          ✅ Sent {result.sent}/{result.total} emails{result.failed > 0 ? ` (${result.failed} failed)` : ''}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
