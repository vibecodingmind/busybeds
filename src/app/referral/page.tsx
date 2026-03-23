'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface ReferralData {
  code: string;
  referralUrl: string;
  totalReferrals: number;
  rewardedMonths: number;
}

// ── Share helpers ─────────────────────────────────────────────────────────────
function shareWhatsApp(url: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(`Join BusyBeds and get hotel discounts! Use my referral link: ${url}`)}`, '_blank');
}
function shareX(url: string) {
  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(`Saving big on hotels with BusyBeds 🏨 Join with my link and we both get bonus days!`)}&url=${encodeURIComponent(url)}`, '_blank');
}

// ── Step component ────────────────────────────────────────────────────────────
function Step({ n, icon, title, desc, last }: { n: number; icon: string; title: string; desc: string; last?: boolean }) {
  return (
    <div className="flex items-start gap-4 relative">
      <div className="flex flex-col items-center">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF6B6B, #E8395A)' }}
        >
          {icon}
        </div>
        {!last && <div className="w-0.5 h-10 bg-gray-200 mt-2" />}
      </div>
      <div className="pt-2 pb-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Step {n}</div>
        <div className="font-bold text-gray-900 text-sm">{title}</div>
        <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

interface EarningsSummary {
  available: number;
  pending: number;
  paid: number;
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // Earnings state
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [payoutError, setPayoutError] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetch('/api/referral').then(r => {
      if (r.status === 401) { router.push('/login?next=/referral'); return r; }
      return r;
    }).then(r => r.json()).then(json => {
      if (json.code) setData(json);
      else setError('Failed to load referral data');
    }).catch(() => setError('Failed to load referral data'))
      .finally(() => setLoading(false));

    fetch('/api/referral/earnings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setEarnings({ available: d.available, pending: d.pending, paid: d.paid }); })
      .catch(() => {});
  }, [router]);

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(''); setPayoutSuccess(''); setPayoutLoading(true);
    try {
      const res = await fetch('/api/referral/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalEmail }),
      });
      const json = await res.json();
      if (!res.ok) { setPayoutError(json.error || 'Failed to request payout'); return; }
      setPayoutSuccess(`Payout of $${earnings?.available.toFixed(2)} requested! We'll process it within 3 business days.`);
      setEarnings(prev => prev ? { ...prev, available: 0, paid: prev.paid + (prev.available) } : prev);
      setPaypalEmail('');
    } catch { setPayoutError('Request failed. Please try again.'); }
    finally { setPayoutLoading(false); }
  };

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(''); setApplySuccess(''); setApplyLoading(true);
    try {
      const res = await fetch('/api/referral/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput }),
      });
      const json = await res.json();
      if (!res.ok) { setApplyError(json.error || 'Failed to apply code'); return; }
      setApplySuccess('Referral code applied! 7 bonus days added to your subscription.');
      setCodeInput('');
      setTimeout(() => window.location.reload(), 2200);
    } catch { setApplyError('Failed to apply code'); }
    finally { setApplyLoading(false); }
  };

  const bonusDays = (data?.rewardedMonths ?? 0) * 7;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <span className="animate-spin w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full" style={{ borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }} className="relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: 'white' }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-5 shadow-xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
            🎁
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
            Refer Friends, Earn Rewards
          </h1>
          <p className="text-white/70 text-base max-w-md mx-auto leading-relaxed">
            Share your unique link. Every friend who joins gets bonus days — and so do you.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white">{data?.totalReferrals ?? 0}</div>
              <div className="text-white/60 text-xs mt-1 font-medium">Friends Referred</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-4xl font-extrabold text-yellow-400">{bonusDays}</div>
              <div className="text-white/60 text-xs mt-1 font-medium">Bonus Days Earned</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-4xl font-extrabold text-green-400">+7</div>
              <div className="text-white/60 text-xs mt-1 font-medium">Days Per Referral</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        {data && (
          <>
            {/* ── Referral link card ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Referral Link</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Share this link — when friends sign up and subscribe, you both get 7 bonus days.</p>

                {/* URL display */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 mb-4">
                  <svg className="flex-shrink-0 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  <span className="flex-1 text-sm font-mono text-gray-700 truncate">{data.referralUrl}</span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: copied ? '#22C55E' : '#111827',
                      color: 'white',
                    }}
                  >
                    {copied ? (
                      <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                    ) : (
                      <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Link</>
                    )}
                  </button>
                  <button
                    onClick={() => shareWhatsApp(data.referralUrl)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#25D366' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => shareX(data.referralUrl)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#000' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.834L1.254 2.25H8.08l4.259 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                    Post on X
                  </button>
                </div>
              </div>

              {/* Referral code badge */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">Your code:</span>
                <span className="font-mono font-bold text-sm text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-200">
                  {data.code}
                </span>
              </div>
            </div>

            {/* ── How it works ────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 text-base mb-6">How it works</h2>
              <Step n={1} icon="🔗" title="Share Your Link" desc="Send your unique referral link to friends via WhatsApp, email, or any channel." />
              <Step n={2} icon="✍️" title="Friend Signs Up & Subscribes" desc="They create a free account, then subscribe to any plan." />
              <Step n={3} icon="💰" title="You Earn 20% Cash" last desc="You earn 20% of their first month's payment. Held 30 days, then available to withdraw." />
            </div>

            {/* ── Earnings section ─────────────────────────────────────────── */}
            <div id="earnings" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 text-base mb-4">💰 Your Cash Earnings</h2>
              {earnings ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center bg-green-50 rounded-xl p-3 border border-green-100">
                      <div className="text-xl font-extrabold text-green-600">${earnings.available.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Available</div>
                    </div>
                    <div className="text-center bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <div className="text-xl font-extrabold text-amber-600">${earnings.pending.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Pending (30-day hold)</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="text-xl font-extrabold text-gray-700">${earnings.paid.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Paid Out</div>
                    </div>
                  </div>

                  {earnings.available >= 20 && !payoutSuccess && (
                    <form onSubmit={handlePayout} className="space-y-3">
                      <p className="text-sm text-gray-600">Request a payout to your PayPal account:</p>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={e => setPaypalEmail(e.target.value)}
                        placeholder="your-paypal@email.com"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-all"
                      />
                      {payoutError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">{payoutError}</p>}
                      <button
                        type="submit"
                        disabled={!paypalEmail.trim() || payoutLoading}
                        className="w-full py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                      >
                        {payoutLoading
                          ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Requesting…</>
                          : `Request $${earnings.available.toFixed(2)} Payout`}
                      </button>
                    </form>
                  )}
                  {payoutSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">{payoutSuccess}</div>
                  )}
                  {earnings.available < 20 && !payoutSuccess && (
                    <p className="text-xs text-gray-400">Minimum payout is $20. Keep referring to reach the threshold!</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">No earnings yet. Start referring friends to earn 20% cash commissions.</p>
              )}
            </div>

            {/* ── Apply a code ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setCodeOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Have a friend&apos;s referral code?</div>
                  <div className="text-xs text-gray-500 mt-0.5">Enter it here to get 7 bonus days</div>
                </div>
                <svg
                  className="text-gray-400 flex-shrink-0 transition-transform"
                  style={{ transform: codeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {codeOpen && (
                <div className="px-6 pb-5 border-t border-gray-100">
                  <form onSubmit={handleApplyCode} className="space-y-3 mt-4">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={e => setCodeInput(e.target.value)}
                      placeholder="e.g., john-a1b2c3d4"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-all font-mono"
                    />
                    {applyError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">{applyError}</p>}
                    {applySuccess && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl border border-green-100">{applySuccess}</p>}
                    <button
                      type="submit"
                      disabled={!codeInput.trim() || applyLoading}
                      className="w-full py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: '#111827' }}
                    >
                      {applyLoading
                        ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Applying…</>
                        : 'Apply Code'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
