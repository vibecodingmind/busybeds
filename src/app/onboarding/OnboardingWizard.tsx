'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Step data ──────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Welcome', icon: '👋' },
  { id: 2, title: 'Your Role', icon: '🏨' },
  { id: 3, title: 'Hotel Basics', icon: '📋' },
  { id: 4, title: 'Set Discount', icon: '🏷️' },
  { id: 5, title: 'Choose Plan', icon: '💳' },
  { id: 6, title: 'All Done!', icon: '🎉' },
];

const HOTEL_TYPES = [
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'resort', label: 'Resort', icon: '🌴' },
  { value: 'villa', label: 'Villa', icon: '🏡' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'lodge', label: 'Lodge', icon: '🌲' },
  { value: 'bnb', label: 'B&B', icon: '☕' },
];

interface FormData {
  role: string;
  hotelName: string;
  city: string;
  country: string;
  category: string;
  starRating: number;
  discountPercent: number;
  roomCount: string;
  description: string;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    role: '',
    hotelName: '',
    city: '',
    country: '',
    category: 'hotel',
    starRating: 3,
    discountPercent: 20,
    roomCount: '',
    description: '',
  });

  const update = (key: keyof FormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const next = () => setStep(s => Math.min(s + 1, STEPS.length));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const submit = async () => {
    setSaving(true);
    try {
      // Create the hotel via portal apply endpoint
      const res = await fetch('/api/portal/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.hotelName,
          city: form.city,
          country: form.country,
          category: form.category,
          starRating: form.starRating,
          discountPercent: form.discountPercent,
          description: form.description,
        }),
      });
      if (res.ok) {
        next(); // Go to done step
      }
    } catch {}
    setSaving(false);
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.id ? 'bg-green-500 text-white' :
                  step === s.id ? 'bg-[#FF385C] text-white shadow-lg scale-110' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${step === s.id ? 'text-[#FF385C] font-semibold' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF385C] to-[#BD1E59] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">

          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center">
              <div className="text-6xl mb-6">🏨</div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Welcome to BusyBeds!</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                List your hotel and start attracting guests with exclusive discount coupons.
                Takes less than 5 minutes to get started.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: '📈', title: 'More Bookings', desc: 'Reach deal-seeking guests' },
                  { icon: '🎫', title: 'Coupon Tools', desc: 'Create exclusive offers' },
                  { icon: '📊', title: 'Analytics', desc: 'Track your performance' },
                ].map(item => (
                  <div key={item.title} className="bg-gray-50 dark:bg-gray-750 rounded-2xl p-4 text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <button onClick={next}
                className="px-10 py-4 bg-[#FF385C] hover:bg-[#e0334f] text-white font-bold rounded-2xl transition-colors text-base">
                Get Started →
              </button>
            </div>
          )}

          {/* Step 2: Role */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What's your role?</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">This helps us customise your experience.</p>
              <div className="space-y-3 mb-8">
                {[
                  { value: 'owner', label: 'Hotel Owner', desc: 'I own one or more properties', icon: '🏨' },
                  { value: 'manager', label: 'Hotel Manager', desc: 'I manage a hotel on behalf of an owner', icon: '💼' },
                  { value: 'chain', label: 'Hotel Chain', desc: 'I represent a chain of hotels', icon: '🏢' },
                ].map(role => (
                  <button key={role.value} onClick={() => update('role', role.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      form.role === role.value
                        ? 'border-[#FF385C] bg-pink-50 dark:bg-pink-950'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}>
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{role.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{role.desc}</p>
                    </div>
                    {form.role === role.value && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-[#FF385C] flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <NavButtons onBack={back} onNext={next} canNext={!!form.role} />
            </div>
          )}

          {/* Step 3: Hotel Basics */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tell us about your hotel</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Basic info guests will see on your listing.</p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hotel Name *</label>
                  <input value={form.hotelName} onChange={e => update('hotelName', e.target.value)}
                    placeholder="e.g. The Grand Nairobi"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                    <input value={form.city} onChange={e => update('city', e.target.value)}
                      placeholder="Nairobi"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country *</label>
                    <input value={form.country} onChange={e => update('country', e.target.value)}
                      placeholder="Kenya"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {HOTEL_TYPES.map(t => (
                      <button key={t.value} type="button" onClick={() => update('category', t.value)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.category === t.value
                            ? 'border-[#FF385C] bg-pink-50 dark:bg-pink-950 text-[#FF385C]'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}>
                        <span className="text-xl">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Star Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button" onClick={() => update('starRating', s)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          form.starRating === s
                            ? 'border-[#FF385C] bg-pink-50 dark:bg-pink-950 text-[#FF385C]'
                            : 'border-gray-200 dark:border-gray-600 text-gray-500'
                        }`}>
                        {'⭐'.repeat(s)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)}
                    rows={3} placeholder="Describe what makes your hotel special…"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none" />
                </div>
              </div>

              <NavButtons onBack={back} onNext={next} canNext={!!(form.hotelName && form.city && form.country)} />
            </div>
          )}

          {/* Step 4: Set Discount */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set your discount</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Higher discounts attract more guests. You can change this anytime.</p>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount percentage</span>
                  <span className="text-3xl font-bold text-[#FF385C]">{form.discountPercent}%</span>
                </div>
                <input type="range" min={5} max={70} step={5}
                  value={form.discountPercent}
                  onChange={e => update('discountPercent', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#FF385C] mb-4" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>5% (subtle)</span>
                  <span>70% (mega deal)</span>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[10, 20, 30, 50].map(d => (
                    <button key={d} type="button" onClick={() => update('discountPercent', d)}
                      className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.discountPercent === d
                          ? 'border-[#FF385C] bg-[#FF385C] text-white'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}>
                      {d}%
                    </button>
                  ))}
                </div>

                <div className="mt-6 bg-gradient-to-r from-pink-50 to-red-50 dark:from-gray-750 dark:to-gray-700 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 Hotels with <strong>{form.discountPercent >= 30 ? 'your discount or higher' : '30%+ discounts'}</strong> get{' '}
                    <strong className="text-[#FF385C]">3× more views</strong> on average.
                    {form.discountPercent < 20 && ' Consider at least 20% to stand out.'}
                  </p>
                </div>
              </div>

              <NavButtons onBack={back} onNext={next} canNext={true} />
            </div>
          )}

          {/* Step 5: Choose Plan */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose your plan</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Start free, upgrade anytime.</p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { name: 'Free', price: '$0', period: 'forever', features: ['1 hotel listing', '10 coupons/month', 'Basic analytics', 'Email support'], highlight: false, cta: 'Start Free' },
                  { name: 'Business', price: '$29', period: '/month', features: ['5 hotel listings', 'Unlimited coupons', 'Advanced analytics', 'Priority support', 'Featured listing'], highlight: true, cta: 'Start Trial' },
                  { name: 'Enterprise', price: '$99', period: '/month', features: ['Unlimited hotels', 'Unlimited coupons', 'Custom branding', 'Dedicated manager', 'API access'], highlight: false, cta: 'Contact Us' },
                ].map(plan => (
                  <div key={plan.name} className={`rounded-2xl p-5 border-2 flex flex-col ${
                    plan.highlight
                      ? 'border-[#FF385C] bg-gradient-to-b from-pink-50 to-white dark:from-pink-950 dark:to-gray-800'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    {plan.highlight && (
                      <span className="self-start px-2 py-0.5 bg-[#FF385C] text-white text-xs font-bold rounded-full mb-3">Most Popular</span>
                    )}
                    <p className="font-bold text-gray-900 dark:text-white">{plan.name}</p>
                    <div className="mt-1 mb-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-sm text-gray-500">{plan.period}</span>
                    </div>
                    <ul className="space-y-1.5 flex-1 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={async () => {
                        if (plan.name === 'Free') { await submit(); }
                        else { router.push('/subscribe'); }
                      }}
                      disabled={saving}
                      className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                        plan.highlight
                          ? 'bg-[#FF385C] hover:bg-[#e0334f] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      {saving && plan.name === 'Free' ? 'Setting up…' : plan.cta}
                    </button>
                  </div>
                ))}
              </div>

              <NavButtons onBack={back} onNext={() => {}} canNext={false} hideNext />
            </div>
          )}

          {/* Step 6: Done */}
          {step === 6 && (
            <div className="text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">You're all set!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                Your hotel listing has been submitted for review. We'll have it live within 24 hours.
              </p>
              <div className="space-y-3 text-left bg-gray-50 dark:bg-gray-750 rounded-2xl p-5 mb-8">
                {[
                  { icon: '📸', text: 'Add photos to your hotel listing' },
                  { icon: '🏷️', text: 'Set up your room types & pricing' },
                  { icon: '📊', text: 'Check your analytics dashboard' },
                  { icon: '🎫', text: 'Create your first coupon campaign' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-lg">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => router.push('/portal')}
                  className="px-8 py-3 bg-[#FF385C] hover:bg-[#e0334f] text-white font-bold rounded-2xl transition-colors">
                  Go to My Portal →
                </button>
                <button onClick={() => router.push('/')}
                  className="px-8 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  View Site
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Nav buttons ──────────────────────────────────────
function NavButtons({ onBack, onNext, canNext, hideNext }: {
  onBack: () => void; onNext: () => void; canNext: boolean; hideNext?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button onClick={onBack}
        className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      {!hideNext && (
        <button onClick={onNext} disabled={!canNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30">
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
    </div>
  );
}
