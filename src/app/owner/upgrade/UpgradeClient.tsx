'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Tier {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceAnnual: number | null;
  featuredOnHomepage: boolean;
  featuredPriority: number;
  searchBoost: number;
  flashDealsPerMonth: number;
  showVerifiedBadge: boolean;
  promotionalEmails: number;
  customBookingLink: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  analyticsLevel: string;
}

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string;
  isComped: boolean;
  tier: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  adminFeatured: boolean;
  adminFeaturedUntil: string | null;
}

interface Props {
  hotel: Hotel;
  currentSubscription: Subscription | null;
  tiers: Tier[];
}

export default function UpgradeClient({ hotel, currentSubscription, tiers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSubscribe = async (tier: Tier) => {
    if (tier.priceMonthly === 0) return; // Free tier
    
    setLoading(tier.id);
    try {
      const res = await fetch('/api/owner/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tier.id,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        router.refresh();
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const currentTierName = currentSubscription?.tier?.name || 'free';
  const savings = billingCycle === 'annual' ? 17 : 0;

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-full p-1 border border-gray-200 flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              billingCycle === 'annual' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Current status banner */}
      {currentSubscription && currentSubscription.status === 'active' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-green-700">
              Current plan: <span className="font-bold">{currentSubscription.tier.displayName}</span>
              {currentSubscription.isComped && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Complimentary</span>}
            </div>
            {!currentSubscription.isComped && (
              <div className="text-xs text-green-600 mt-0.5">
                Renews: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin featured status */}
      {hotel.adminFeatured && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <div className="text-sm font-medium text-amber-800">Admin Featured</div>
            <div className="text-xs text-amber-600">
              Your hotel is manually featured by admin until {' '}
              {hotel.adminFeaturedUntil ? new Date(hotel.adminFeaturedUntil).toLocaleDateString() : 'ongoing'}
            </div>
          </div>
        </div>
      )}

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map(tier => {
          const isCurrent = tier.name === currentTierName;
          const price = billingCycle === 'annual' && tier.priceAnnual 
            ? tier.priceAnnual / 12 
            : tier.priceMonthly;
          const fullPrice = billingCycle === 'annual' && tier.priceAnnual 
            ? tier.priceAnnual 
            : tier.priceMonthly;

          return (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl border-2 p-5 relative ${
                isCurrent 
                  ? 'border-green-400 ring-2 ring-green-100' 
                  : tier.name === 'growth'
                  ? 'border-[#E8395A] shadow-lg'
                  : 'border-gray-100'
              }`}
            >
              {tier.name === 'growth' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8395A] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="text-center mb-4">
                <h3 className="font-bold text-gray-900">{tier.displayName}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">${Math.round(price)}</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>
                {billingCycle === 'annual' && tier.priceAnnual && (
                  <div className="text-xs text-gray-500 mt-1">
                    ${tier.priceAnnual} billed annually
                  </div>
                )}
              </div>

              {/* Features list */}
              <ul className="space-y-2 text-sm mb-5">
                <li className="flex items-center gap-2">
                  {tier.featuredOnHomepage ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.featuredOnHomepage ? 'text-gray-700' : 'text-gray-400'}>
                    Featured on homepage
                    {tier.featuredOnHomepage && tier.featuredPriority > 0 && (
                      <span className="text-xs text-gray-400 ml-1">(Priority {tier.featuredPriority})</span>
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.searchBoost > 0 ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.searchBoost > 0 ? 'text-gray-700' : 'text-gray-400'}>
                    Search boost +{tier.searchBoost}%
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.showVerifiedBadge ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.showVerifiedBadge ? 'text-gray-700' : 'text-gray-400'}>
                    Verified badge
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.flashDealsPerMonth > 0 ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.flashDealsPerMonth > 0 ? 'text-gray-700' : 'text-gray-400'}>
                    {tier.flashDealsPerMonth >= 999 ? 'Unlimited' : tier.flashDealsPerMonth} flash deals/mo
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.promotionalEmails > 0 ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.promotionalEmails > 0 ? 'text-gray-700' : 'text-gray-400'}>
                    {tier.promotionalEmails >= 999 ? 'Unlimited' : tier.promotionalEmails} promo emails/mo
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.customBookingLink ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.customBookingLink ? 'text-gray-700' : 'text-gray-400'}>
                    Custom booking link
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.prioritySupport ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.prioritySupport ? 'text-gray-700' : 'text-gray-400'}>
                    Priority support
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.apiAccess ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span className={tier.apiAccess ? 'text-gray-700' : 'text-gray-400'}>
                    API access
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 capitalize">{tier.analyticsLevel} analytics</span>
                </li>
              </ul>

              {/* CTA button */}
              {tier.priceMonthly === 0 ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600"
                >
                  Current Plan
                </button>
              ) : isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-green-100 text-green-700"
                >
                  ✓ Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={loading === tier.id}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50 ${
                    tier.name === 'growth' ? 'bg-[#E8395A] hover:opacity-90' : 'bg-[#1A3C5E] hover:opacity-90'
                  }`}
                >
                  {loading === tier.id ? 'Loading...' : currentSubscription ? 'Switch Plan' : 'Get Started'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Compare features table */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Compare Plans</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Feature</th>
                {tiers.map(tier => (
                  <th key={tier.id} className="px-4 py-3 text-center font-semibold text-gray-700">
                    {tier.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 text-gray-600">Homepage Featured</td>
                {tiers.map(tier => (
                  <td key={tier.id} className="px-4 py-3 text-center">
                    {tier.featuredOnHomepage ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600">Search Priority</td>
                {tiers.map(tier => (
                  <td key={tier.id} className="px-4 py-3 text-center font-medium">
                    {tier.searchBoost > 0 ? `+${tier.searchBoost}%` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600">Flash Deals/Month</td>
                {tiers.map(tier => (
                  <td key={tier.id} className="px-4 py-3 text-center font-medium">
                    {tier.flashDealsPerMonth >= 999 ? '∞' : tier.flashDealsPerMonth || '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600">Promo Emails/Month</td>
                {tiers.map(tier => (
                  <td key={tier.id} className="px-4 py-3 text-center font-medium">
                    {tier.promotionalEmails >= 999 ? '∞' : tier.promotionalEmails || '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600">Analytics</td>
                {tiers.map(tier => (
                  <td key={tier.id} className="px-4 py-3 text-center capitalize">
                    {tier.analyticsLevel}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { q: 'Can I change my plan later?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately.' },
            { q: 'What happens when my subscription ends?', a: 'Your hotel will return to the Free tier. You\'ll keep all your data and can resubscribe anytime.' },
            { q: 'How do flash deals work?', a: 'Flash deals are time-limited discount offers. Premium plans let you create more flash deals to attract more guests.' },
            { q: 'What is a Verified badge?', a: 'A Verified badge shows guests that your hotel is an active partner with verified credentials.' },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="font-semibold text-gray-900 mb-1">{faq.q}</div>
              <div className="text-sm text-gray-500">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
