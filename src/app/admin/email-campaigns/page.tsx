'use client';
import { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  title: string;
  content: string;
  recipientCount: number;
  openCount: number;
  sentAt: string;
}

const AUDIENCE_OPTIONS = [
  { value: 'all',          label: 'All verified users',       desc: 'Everyone with a verified email' },
  { value: 'subscribers',  label: 'Active subscribers only',  desc: 'Users with a live subscription' },
  { value: 'travelers',    label: 'Travelers only',           desc: 'Users with traveler role' },
  { value: 'hotel_owners', label: 'Hotel owners & managers',  desc: 'Portal users only' },
];

export default function AdminEmailCampaignsPage() {
  const [campaigns, setCampaigns]     = useState<Campaign[]>([]);
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [audience, setAudience]       = useState('subscribers');
  const [sending, setSending]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const [result, setResult]           = useState<{ sent?: number; failed?: number; total?: number; skipped?: string } | null>(null);

  // Test email state
  const [testTo, setTestTo]           = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/email-campaigns')
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns || []))
      .finally(() => setLoading(false));
  }, []);

  const sendCampaign = async (sendNow: boolean) => {
    if (!title.trim() || !content.trim()) return alert('Fill in title and content');
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, audience, sendNow }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Something went wrong'); return; }
      setCampaigns(prev => [data.campaign, ...prev]);
      setResult({ sent: data.sent, failed: data.failed, total: data.total, skipped: data.skipped });
      if (sendNow) { setTitle(''); setContent(''); }
    } finally {
      setSending(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testTo.trim()) return alert('Enter an email address');
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo }),
      });
      const data = await res.json();
      setTestResult(data.success
        ? `✅ ${data.message}`
        : `❌ ${data.error}`);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Campaigns</h1>
        <p className="text-gray-500">Send bulk emails to your users via Resend</p>
      </div>

      {/* ── Test Email ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span>🧪</span> Test Email Delivery
        </h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={testTo}
            onChange={e => setTestTo(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={sendTestEmail}
            disabled={testSending}
            className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {testSending ? 'Sending...' : 'Send Test'}
          </button>
        </div>
        {testResult && (
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">{testResult}</p>
        )}
      </div>

      {/* ── Compose ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 space-y-5">
        <h2 className="text-xl font-semibold">New Campaign</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">Subject / Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., 🔥 Flash Sale this weekend — up to 40% off!"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Email Body</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your message here. Use plain text — it will be formatted automatically."
            rows={8}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Audience</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AUDIENCE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  audience === opt.value
                    ? 'border-[#E8395A] bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  value={opt.value}
                  checked={audience === opt.value}
                  onChange={() => setAudience(opt.value)}
                  className="mt-0.5 accent-[#E8395A]"
                />
                <div>
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {result && (
          <div className={`rounded-xl p-4 text-sm font-medium ${
            result.skipped ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'
          }`}>
            {result.skipped === 'draft'
              ? '📝 Saved as draft — not sent yet.'
              : result.skipped === 'no_recipients'
              ? '⚠️ No recipients found for this audience.'
              : `✅ Sent ${result.sent} / ${result.total} emails${result.failed ? ` · ${result.failed} failed` : ''}.`}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => sendCampaign(false)}
            disabled={sending}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {sending ? '...' : 'Save Draft'}
          </button>
          <button
            onClick={() => sendCampaign(true)}
            disabled={sending}
            className="flex-1 py-3 bg-gradient-to-r from-[#E8395A] to-[#c0284a] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {sending ? 'Sending...' : '🚀 Send Now'}
          </button>
        </div>
      </div>

      {/* ── History ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6">Campaign History</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No campaigns yet</div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.recipientCount > 0 ? `${c.recipientCount} recipients` : 'Draft'}
                    {c.openCount > 0 && ` · ${c.openCount} opens`}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0 ml-4">
                  {new Date(c.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
