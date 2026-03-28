'use client';
import { useState, useEffect } from 'react';

type SettingGroup = {
  id: string;
  label: string;
  icon: string;
  description: string;
  fields: SettingField[];
};

type SettingField = {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'url' | 'email' | 'toggle' | 'number' | 'select';
  options?: string[];
  hint?: string;
};

const SETTING_GROUPS: SettingGroup[] = [
  {
    id: 'general',
    label: 'General',
    icon: '🌐',
    description: 'Platform name, branding and contact details',
    fields: [
      { key: 'siteName',    label: 'Platform Name',    placeholder: 'BusyBeds', type: 'text' },
      { key: 'siteUrl',     label: 'Site URL',          placeholder: 'https://busybeds.com', type: 'url' },
      { key: 'supportEmail',label: 'Support Email',     placeholder: 'support@busybeds.com', type: 'email' },
      { key: 'defaultCurrency', label: 'Default Currency', placeholder: 'TZS', type: 'select', options: ['TZS', 'USD'] },
    ],
  },
  {
    id: 'stripe',
    label: 'Stripe Payments',
    icon: '💳',
    description: 'Stripe API keys for subscription billing',
    fields: [
      { key: 'stripePublishableKey', label: 'Publishable Key', placeholder: 'pk_live_…', type: 'text', hint: 'Starts with pk_live_ or pk_test_' },
      { key: 'stripeSecretKey',      label: 'Secret Key',      placeholder: 'sk_live_…', type: 'password', hint: 'Keep this secret — never expose in client code' },
      { key: 'stripeWebhookSecret',  label: 'Webhook Secret',  placeholder: 'whsec_…', type: 'password', hint: 'From Stripe Dashboard → Webhooks' },
    ],
  },
  {
    id: 'email',
    label: 'Email (SMTP)',
    icon: '✉️',
    description: 'SMTP credentials for transactional emails',
    fields: [
      { key: 'smtpHost',     label: 'SMTP Host',      placeholder: 'smtp.sendgrid.net', type: 'text' },
      { key: 'smtpPort',     label: 'SMTP Port',      placeholder: '587', type: 'number' },
      { key: 'smtpUser',     label: 'SMTP Username',  placeholder: 'apikey', type: 'text' },
      { key: 'smtpPass',     label: 'SMTP Password',  placeholder: '••••••••', type: 'password' },
      { key: 'emailFrom',    label: 'From Address',   placeholder: 'no-reply@busybeds.com', type: 'email' },
    ],
  },
  {
    id: 'google',
    label: 'Google OAuth',
    icon: '🔑',
    description: 'Google sign-in credentials',
    fields: [
      { key: 'googleClientId',     label: 'Client ID',     placeholder: '1234567890-abc.apps.googleusercontent.com', type: 'text' },
      { key: 'googleClientSecret', label: 'Client Secret', placeholder: 'GOCSPX-…', type: 'password' },
    ],
  },
  {
    id: 'cloudinary',
    label: 'Cloudinary (Images)',
    icon: '🖼️',
    description: 'Image hosting and CDN via Cloudinary',
    fields: [
      { key: 'cloudinaryCloudName', label: 'Cloud Name',  placeholder: 'my-cloud', type: 'text' },
      { key: 'cloudinaryApiKey',    label: 'API Key',     placeholder: '123456789012345', type: 'text' },
      { key: 'cloudinaryApiSecret', label: 'API Secret',  placeholder: '••••••••••••••••', type: 'password' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform Rules',
    icon: '⚙️',
    description: 'Default coupon, discount and booking behaviour',
    fields: [
      { key: 'defaultDiscountPercent', label: 'Default Discount %', placeholder: '15', type: 'number' },
      { key: 'defaultCouponValidDays', label: 'Coupon Valid Days',  placeholder: '30', type: 'number' },
      { key: 'maxCouponsPerUser',      label: 'Max Coupons / User', placeholder: '10', type: 'number' },
      { key: 'maintenanceMode',        label: 'Maintenance Mode',   placeholder: '', type: 'toggle', hint: 'Shows a maintenance page to non-admins' },
    ],
  },
  {
    id: 'referral',
    label: 'Referral Program',
    icon: '🤝',
    description: 'Control referral rewards, hold period and minimum payout',
    fields: [
      { key: 'referralRewardPercent',  label: 'Reward % of First Month',  placeholder: '20', type: 'number', hint: 'Referrer earns this % of the referred user\'s first subscription payment' },
      { key: 'referralHoldDays',       label: 'Earnings Hold (days)',      placeholder: '30', type: 'number', hint: 'Days before earnings become available for withdrawal' },
      { key: 'referralMinPayout',      label: 'Minimum Payout (USD)',      placeholder: '20', type: 'number', hint: 'Minimum balance required to request a payout' },
      { key: 'referralBonusDays',      label: 'Bonus Days on Referral',    placeholder: '7',  type: 'number', hint: 'Free subscription days added to both referrer and referred' },
    ],
  },
  {
    id: 'sms',
    label: 'SMS (SDASMS)',
    icon: '📱',
    description: 'SDASMS API settings for automated SMS notifications',
    fields: [
      { key: 'sdasmsApiToken',  label: 'SDASMS API Token', placeholder: '1|your_token_here', type: 'text', hint: 'Get from my.sdasms.com → Developers → API Token' },
      { key: 'sdasmsSenderId', label: 'Sender ID (max 11 chars)', placeholder: 'BusyBeds', type: 'text', hint: 'Alphanumeric sender shown to recipients. Max 11 characters.' },
    ],
  },
  {
    id: 'currency',
    label: 'Currency Rates',
    icon: '💱',
    description: 'Live conversion rates used to display prices site-wide',
    fields: [],   // rendered separately
  },
];

// Local state — persisted to .env.local / config in a real app via the API
const DEFAULT_VALS: Record<string, string> = {
  siteName: 'BusyBeds', defaultCurrency: 'TZS', defaultDiscountPercent: '15',
  defaultCouponValidDays: '30', maxCouponsPerUser: '10', maintenanceMode: 'false',
  referralRewardPercent: '20', referralHoldDays: '30', referralMinPayout: '20', referralBonusDays: '7',
  sdasmsApiToken: '', sdasmsSenderId: 'BusyBeds',
};

const CURRENCY_META: Record<string, { name: string; symbol: string; flag: string }> = {
  TZS: { name: 'Tanzanian Shilling',  symbol: 'TSh', flag: '🇹🇿' },
  USD: { name: 'US Dollar',           symbol: '$',   flag: '🇺🇸' },
};

export default function SettingsPage() {
  const [values, setValues]     = useState<Record<string, string>>(DEFAULT_VALS);
  const [saved, setSaved]       = useState<Record<string, boolean>>({});
  const [saving, setSaving]     = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('general');

  // Currency rates state
  const [rates, setRates]         = useState<Record<string, string>>({ TZS: '2600', USD: '1' });
  const [ratesSaved, setRatesSaved]   = useState(false);
  const [ratesSaving, setRatesSaving] = useState(false);
  const [ratesError, setRatesError]   = useState('');

  // Load all saved settings on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.values) setValues(prev => ({ ...prev, ...data.values }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'currency') {
      fetch('/api/admin/currency-rates')
        .then(r => r.json())
        .then(data => {
          if (data.rates) {
            const strRates: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.rates)) strRates[k] = String(v);
            setRates(strRates);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const saveRates = async () => {
    setRatesSaving(true);
    setRatesError('');
    try {
      const numRates: Record<string, number> = {};
      for (const [k, v] of Object.entries(rates)) {
        const n = parseFloat(v);
        if (isNaN(n) || n <= 0) throw new Error(`Invalid rate for ${k}`);
        numRates[k] = n;
      }
      const res = await fetch('/api/admin/currency-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: numRates }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setRatesSaved(true);
      setTimeout(() => setRatesSaved(false), 3000);
    } catch (e: any) {
      setRatesError(e.message || 'Save failed');
    } finally {
      setRatesSaving(false);
    }
  };

  const set = (k: string, v: string) => { setValues(prev => ({ ...prev, [k]: v })); setSaved(prev => ({ ...prev, [activeTab]: false })); };

  const saveGroup = async (groupId: string) => {
    setSaving(prev => ({ ...prev, [groupId]: true }));
    const group = SETTING_GROUPS.find(g => g.id === groupId);
    const groupValues: Record<string, string> = {};
    for (const f of group?.fields || []) {
      if (values[f.key] !== undefined) groupValues[f.key] = values[f.key];
    }
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: groupValues }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(prev => ({ ...prev, [groupId]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [groupId]: false })), 3000);
    } catch {
      // Show brief error state — could add error toast here
    } finally {
      setSaving(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const activeGroup = SETTING_GROUPS.find(g => g.id === activeTab)!;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">API & Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure integrations, keys, and platform behaviour</p>
      </div>

      <div className="flex gap-5">
        {/* Left: tab sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {SETTING_GROUPS.map(g => (
            <button key={g.id} onClick={() => setActiveTab(g.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${activeTab === g.id ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              style={activeTab === g.id ? { background: '#E8395A' } : {}}>
              <span>{g.icon}</span>
              {g.label}
            </button>
          ))}
        </div>

        {/* Right: fields */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6">

          {/* ── Currency Rates tab ── */}
          {activeTab === 'currency' ? (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>💱</span> Currency Rates
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Set how many units of each currency equal <strong>1 USD</strong>. Changes apply site-wide instantly.
                  </p>
                </div>
                <button onClick={saveRates} disabled={ratesSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${ratesSaved ? 'bg-green-50 text-green-700' : 'text-white hover:opacity-90'}`}
                  style={!ratesSaved ? { background: '#E8395A' } : {}}>
                  {ratesSaving ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                  ) : ratesSaved ? (
                    <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg> Saved!</>
                  ) : 'Save Rates'}
                </button>
              </div>

              {ratesError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{ratesError}</div>
              )}

              <div className="space-y-4 max-w-lg">
                {Object.entries(CURRENCY_META).map(([code, meta]) => (
                  <div key={code} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <span className="text-2xl flex-shrink-0">{meta.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{code} — {meta.name}</p>
                      <p className="text-xs text-gray-400">1 USD = ? {code}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {code === 'USD' ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
                          <span className="text-sm font-mono font-semibold text-gray-500">1.00</span>
                          <span className="text-xs text-gray-400">(base)</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-gray-500 font-medium">1 USD =</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.0001"
                              step="any"
                              value={rates[code] ?? ''}
                              onChange={e => setRates(prev => ({ ...prev, [code]: e.target.value }))}
                              className="w-32 px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] text-right"
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-600 w-8">{code}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700">
                <strong>How it works:</strong> Enter the current exchange rate for each currency against USD.
                For example if today 1 USD = 2,650 Tanzanian Shillings, enter <code className="bg-blue-100 px-1 rounded">2650</code> next to TZS.
                All hotel prices across the site will update immediately for users who have selected that currency.
              </div>
            </>
          ) : (
            /* ── All other tabs ── */
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>{activeGroup.icon}</span> {activeGroup.label}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">{activeGroup.description}</p>
                </div>
                <button
                  onClick={() => saveGroup(activeGroup.id)}
                  disabled={saving[activeGroup.id]}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saved[activeGroup.id] ? 'bg-green-50 text-green-700' : 'text-white hover:opacity-90'}`}
                  style={!saved[activeGroup.id] ? { background: '#E8395A' } : {}}>
                  {saving[activeGroup.id] ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                  ) : saved[activeGroup.id] ? (
                    <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg> Saved!</>
                  ) : 'Save Changes'}
                </button>
              </div>

              <div className="space-y-5">
                {activeGroup.fields.map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{f.label}</label>
                    {f.type === 'toggle' ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => set(f.key, values[f.key] === 'true' ? 'false' : 'true')}
                          className={`relative w-12 h-6 rounded-full transition-colors ${values[f.key] === 'true' ? 'bg-[#E8395A]' : 'bg-gray-200'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${values[f.key] === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-sm text-gray-600">{values[f.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                        {f.hint && <span className="text-xs text-gray-400">— {f.hint}</span>}
                      </div>
                    ) : f.type === 'select' ? (
                      <select value={values[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] bg-white max-w-xs">
                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="relative max-w-lg">
                        <input
                          type={f.type === 'password' ? (showKeys[f.key] ? 'text' : 'password') : f.type}
                          value={values[f.key] || ''}
                          onChange={e => set(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] font-mono pr-10"
                        />
                        {f.type === 'password' && (
                          <button onClick={() => setShowKeys(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showKeys[f.key] ? (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {f.hint && f.type !== 'toggle' && <p className="text-xs text-gray-400 mt-1">{f.hint}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
