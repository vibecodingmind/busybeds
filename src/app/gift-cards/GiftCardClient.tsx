'use client';
import { useState } from 'react';

const AMOUNTS = [10, 25, 50, 100, 200];

export default function GiftCardClient() {
  const [amount, setAmount] = useState(50);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [result, setResult] = useState<{ code: string; amount: number } | null>(null);
  const [error, setError] = useState('');

  // Redeem tab
  const [redeemCode, setRedeemCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState('');

  const [tab, setTab] = useState<'buy' | 'redeem'>('buy');

  const purchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchasing(true); setError('');
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, recipientName, recipientEmail, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ code: data.card.code, amount: data.card.amount });
      } else {
        setError(data.error || 'Failed to create gift card');
      }
    } catch { setError('Connection error'); }
    setPurchasing(false);
  };

  const checkCode = async () => {
    if (!redeemCode.trim()) return;
    setChecking(true); setCheckResult(null);
    try {
      const res = await fetch(`/api/gift-cards/check?code=${redeemCode.trim()}`);
      const data = await res.json();
      setCheckResult(data);
    } catch {}
    setChecking(false);
  };

  const redeem = async () => {
    setRedeeming(true);
    try {
      const res = await fetch('/api/gift-cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode }),
      });
      const data = await res.json();
      setRedeemResult(data.message || data.error);
      if (res.ok) { setRedeemCode(''); setCheckResult(null); }
    } catch {}
    setRedeeming(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🎁</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gift Cards</h1>
        <p className="text-gray-500">Give the gift of amazing hotel deals. Valid for 1 year.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8">
        {(['buy', 'redeem'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t === 'buy' ? '💳 Buy a Gift Card' : '🎫 Redeem a Gift Card'}
          </button>
        ))}
      </div>

      {tab === 'buy' ? (
        result ? (
          // Success state
          <div className="bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-800 dark:to-gray-700 border border-pink-200 dark:border-pink-800 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gift Card Created!</h2>
            <p className="text-gray-500 mb-6">Share this code with the recipient</p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6 inline-block">
              <p className="text-xs text-gray-400 mb-1">Gift Card Code</p>
              <p className="text-3xl font-mono font-bold text-[#FF385C] tracking-widest">{result.code}</p>
              <p className="text-sm text-gray-500 mt-2">Value: <strong>${result.amount}</strong></p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigator.clipboard.writeText(result.code)}
                className="px-4 py-2 bg-[#FF385C] text-white text-sm font-semibold rounded-xl hover:bg-[#e0334f] transition-colors">
                Copy Code
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`🎁 Here's your BusyBeds gift card!\nCode: ${result.code}\nValue: $${result.amount}\nRedeem at: ${typeof window !== 'undefined' ? window.location.origin : ''}/gift-cards`)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors">
                Share on WhatsApp
              </a>
            </div>
            <button onClick={() => setResult(null)} className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Buy another →
            </button>
          </div>
        ) : (
          <form onSubmit={purchase} className="space-y-6">
            {/* Amount selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Amount</label>
              <div className="grid grid-cols-5 gap-2">
                {AMOUNTS.map(a => (
                  <button key={a} type="button" onClick={() => setAmount(a)}
                    className={`py-3 rounded-xl font-bold text-sm transition-all ${amount === a ? 'bg-[#FF385C] text-white shadow-md scale-105' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    ${a}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Name (optional)</label>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Email (optional)</label>
                <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="sarah@email.com"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]" />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personal Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={200}
                placeholder="Happy Birthday! Enjoy a luxury stay on me 🎉"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none" />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">{error}</p>}

            <button type="submit" disabled={purchasing}
              className="w-full py-4 bg-[#FF385C] hover:bg-[#e0334f] text-white font-bold rounded-2xl transition-colors disabled:opacity-60 text-base">
              {purchasing ? 'Creating Gift Card…' : `Buy $${amount} Gift Card`}
            </button>
            <p className="text-center text-xs text-gray-400">Valid for 1 year · Can be redeemed for loyalty points</p>
          </form>
        )
      ) : (
        // Redeem tab
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Enter Gift Card Code</label>
            <div className="flex gap-2">
              <input
                value={redeemCode}
                onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setCheckResult(null); setRedeemResult(''); }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF385C] tracking-wider"
              />
              <button onClick={checkCode} disabled={checking || !redeemCode.trim()}
                className="px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
                {checking ? '…' : 'Check'}
              </button>
            </div>
          </div>

          {checkResult && (
            <div className={`rounded-2xl p-4 ${checkResult.valid ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
              {checkResult.valid ? (
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">Valid Gift Card</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Balance: <strong>${checkResult.balance}</strong>
                    {checkResult.expiresAt && ` · Expires: ${new Date(checkResult.expiresAt).toLocaleDateString()}`}
                  </p>
                  <button onClick={redeem} disabled={redeeming}
                    className="mt-3 px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {redeeming ? 'Redeeming…' : `Redeem $${checkResult.balance}`}
                  </button>
                </div>
              ) : (
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{checkResult.error}</p>
              )}
            </div>
          )}

          {redeemResult && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300 font-medium">
              {redeemResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
