'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

interface LoyaltyData {
  points: number;
  lifetime: number;
  transactions: Transaction[];
}

const REWARDS = [
  { points: 100,  reward: '5% extra discount on next coupon',  icon: '🎟️' },
  { points: 250,  reward: 'Skip queue – coupon valid 3 extra days', icon: '⏰' },
  { points: 500,  reward: 'Free gift card ($5 value)',           icon: '🎁' },
  { points: 1000, reward: 'VIP badge + 10% bonus coupons',      icon: '👑' },
  { points: 2500, reward: '$25 gift card',                       icon: '💳' },
  { points: 5000, reward: 'One free premium hotel night',       icon: '🏨' },
];

const EARN_WAYS = [
  { icon: '🎫', action: 'Generate a coupon',    points: '+10 pts' },
  { icon: '✅', action: 'Redeem a coupon',       points: '+25 pts' },
  { icon: '⭐', action: 'Leave a review',        points: '+15 pts' },
  { icon: '👥', action: 'Refer a friend',        points: '+100 pts' },
  { icon: '🎁', action: 'Buy a gift card',       points: '+10 pts/$' },
  { icon: '📰', action: 'Subscribe to newsletter', points: '+20 pts' },
];

export default function LoyaltyDashboard() {
  const [data, setData] = useState<LoyaltyData>({ points: 0, lifetime: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/loyalty')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const nextReward = REWARDS.find(r => r.points > data.points);
  const progressToNext = nextReward
    ? Math.min(100, (data.points / nextReward.points) * 100)
    : 100;

  const tier =
    data.lifetime >= 5000 ? { name: 'Platinum', color: '#7C3AED', icon: '💎' } :
    data.lifetime >= 1000 ? { name: 'Gold',     color: '#D97706', icon: '🥇' } :
    data.lifetime >= 250  ? { name: 'Silver',   color: '#6B7280', icon: '🥈' } :
                            { name: 'Bronze',   color: '#92400E', icon: '🥉' };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl text-white p-6"
          style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E7C7B 100%)' }}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 text-[120px] leading-none">★</div>
          </div>

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/70 text-sm font-medium mb-1">Your BusyBeds Points</div>
                {loading ? (
                  <div className="h-12 w-32 bg-white/20 rounded-xl animate-pulse" />
                ) : (
                  <div className="text-5xl font-black tracking-tight">{data.points.toLocaleString()}</div>
                )}
                <div className="text-white/60 text-xs mt-1">{data.lifetime.toLocaleString()} lifetime points earned</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-2xl">{tier.icon}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">{tier.name}</span>
              </div>
            </div>

            {/* Progress to next reward */}
            {nextReward && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                  <span>Progress to next reward</span>
                  <span className="font-semibold text-white">{data.points} / {nextReward.points}</span>
                </div>
                <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
                <div className="text-xs text-white/60 mt-1.5">
                  {nextReward.points - data.points} more points for: <span className="text-white font-medium">{nextReward.reward}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/coupons" className="card p-3 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">🎫</div>
            <div className="text-xs font-semibold text-gray-700">My Coupons</div>
          </Link>
          <Link href="/gift-cards" className="card p-3 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">🎁</div>
            <div className="text-xs font-semibold text-gray-700">Gift Cards</div>
          </Link>
          <Link href="/referral" className="card p-3 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xs font-semibold text-gray-700">Refer & Earn</div>
          </Link>
        </div>

        {/* Rewards milestones */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏆</span> Rewards
          </h2>
          <div className="space-y-3">
            {REWARDS.map(r => {
              const achieved = data.points >= r.points;
              const isCurrent = r === nextReward;
              return (
                <div
                  key={r.points}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    achieved ? 'bg-teal-50 border border-teal-200' :
                    isCurrent ? 'bg-amber-50 border border-amber-200' :
                    'bg-gray-50 border border-transparent'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${achieved ? 'text-teal-700' : 'text-gray-700'}`}>
                      {r.reward}
                    </div>
                    <div className="text-xs text-gray-400">{r.points.toLocaleString()} points</div>
                  </div>
                  {achieved ? (
                    <span className="flex-shrink-0 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                  ) : isCurrent ? (
                    <span className="flex-shrink-0 text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Next</span>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-gray-300 font-medium">{r.points.toLocaleString()}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* How to earn */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span> How to Earn Points
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {EARN_WAYS.map(w => (
              <div key={w.action} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                <span className="text-lg flex-shrink-0">{w.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-700 leading-tight">{w.action}</div>
                  <div className="text-xs font-bold text-teal-600 mt-0.5">{w.points}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📜</span> Point History
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : data.transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-gray-500 text-sm">No transactions yet. Start earning points!</p>
              <Link href="/" className="mt-3 inline-block btn-primary text-sm px-5">Browse Hotels →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data.transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{t.reason}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.points > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                    {t.points > 0 ? '+' : ''}{t.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tier info */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">⚡</span> Tier Status
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Bronze', min: 0,    icon: '🥉', color: 'border-amber-700' },
              { name: 'Silver', min: 250,  icon: '🥈', color: 'border-gray-400' },
              { name: 'Gold',   min: 1000, icon: '🥇', color: 'border-yellow-500' },
              { name: 'Plat',   min: 5000, icon: '💎', color: 'border-purple-500' },
            ].map(t => {
              const isCurrent = tier.name.startsWith(t.name.slice(0, 4));
              return (
                <div key={t.name} className={`p-2.5 rounded-xl text-center border-2 transition-all ${isCurrent ? t.color + ' bg-white shadow-sm' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="text-xl">{t.icon}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>{t.name}</div>
                  <div className="text-[10px] text-gray-400">{t.min.toLocaleString()}+</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
