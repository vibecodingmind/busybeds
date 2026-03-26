'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { COUNTRIES, getCities } from '@/lib/locations';

interface Hotel { id: string; name: string; city: string; country: string; starRating: number; }

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: '', color: '#e2e8f0' },
    { score: 1, label: 'Weak', color: '#EF4444' },
    { score: 2, label: 'Fair', color: '#F97316' },
    { score: 3, label: 'Good', color: '#EAB308' },
    { score: 4, label: 'Strong', color: '#22C55E' },
  ];
  return levels[score];
}

const inputCls = 'w-full pl-12 pr-4 py-4 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none';

const ROLE_OPTIONS = [
  {
    value: 'traveler',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    ),
    title: 'Traveler',
    desc: 'I want hotel discounts',
  },
  {
    value: 'hotel_owner',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Hotel Host',
    desc: 'I manage a property',
  },
];

function StepIndicator({ step }: { step: number }) {
  const labels = ['Role', 'Details', 'Location'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: done ? '#dcfce7' : active ? 'linear-gradient(135deg, #fb7185, #ec4899)' : 'rgba(255,255,255,0.8)',
                color: done ? '#16a34a' : active ? 'white' : '#94a3b8',
                border: done ? '1px solid #bbf7d0' : active ? '1px solid transparent' : '1px solid #e2e8f0',
                boxShadow: active ? '0 4px 15px rgba(251, 113, 133, 0.3)' : 'none',
              }}
            >
              {done ? <CheckIcon /> : <span className="w-4 h-4 flex items-center justify-center">{n}</span>}
              <span>{label}</span>
            </div>
            {n < 3 && (
              <div className="w-8 h-0.5 rounded-full" style={{ background: done ? '#22c55e' : '#e2e8f0' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RegisterForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: '', country: '', city: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralApplied, setReferralApplied] = useState(false);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelSearch, setHotelSearch] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [hotelsLoaded, setHotelsLoaded] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const cities = getCities(form.country);
  const pwStrength = passwordStrength(form.password);

  useEffect(() => {
    if (form.role === 'hotel_owner' && !hotelsLoaded) {
      fetch('/api/hotels?status=active')
        .then(r => r.json())
        .then(d => { setHotels(d.hotels || []); setHotelsLoaded(true); });
    }
  }, [form.role, hotelsLoaded]);

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(hotelSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hotelSearch.toLowerCase())
  );

  const nextStep = () => {
    if (step === 1 && !form.role) { setError('Please choose your role to continue.'); return; }
    if (step === 2) {
      if (!form.fullName.trim()) { setError('Full name is required.'); return; }
      if (!form.email.trim()) { setError('Email is required.'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }
    setError('');
    setStep(step + 1);
  };

  const submit = async () => {
    if (form.role === 'hotel_owner' && !selectedHotel) {
      setError('Please select the hotel you represent before continuing.'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          hotelId: form.role === 'hotel_owner' ? selectedHotel?.id : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Registration failed'); return; }
      if (refCode) {
        try {
          const refRes = await fetch('/api/referral/use', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: refCode }),
          });
          if (refRes.ok) setReferralApplied(true);
        } catch (err) { console.error('Referral error:', err); }
      }
      router.push(form.role === 'traveler' ? '/subscribe' : '/apply/status');
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Light Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl" />
      </div>

      {/* Glass Card */}
      <div className="relative w-full max-w-md">
        {/* Subtle Shadow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-200 via-violet-200 to-cyan-200 rounded-3xl blur opacity-40" />
        
        <div className="relative backdrop-blur-2xl bg-white/70 border border-white/80 rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/25 transform hover:scale-105 transition-transform duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">BusyBeds</span>
            </Link>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
            <p className="text-slate-500">Join thousands of smart travelers</p>
          </div>

          {/* Step Indicator */}
          <StepIndicator step={step} />

          {/* STEP 1: Role selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(opt => {
                  const selected = form.role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setForm({ ...form, role: opt.value }); setError(''); }}
                      className={`p-5 rounded-2xl text-left transition-all border-2 ${selected ? 'border-pink-300 bg-pink-50 shadow-lg shadow-pink-200/50' : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-white/80'}`}
                    >
                      <div className="text-pink-500 mb-3">{opt.icon}</div>
                      <div className="font-semibold text-slate-800 text-sm">{opt.title}</div>
                      <div className="text-xs text-slate-500 mb-2">{opt.desc}</div>
                      {selected && (
                        <div className="flex items-center gap-1 text-xs text-pink-600 font-medium">
                          <CheckIcon /> Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <span className="text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>

              <a href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all">
                <GoogleIcon /> Continue with Google
              </a>

              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}

              <button type="button" onClick={nextStep}
                className="w-full py-4 bg-gradient-to-r from-rose-400 via-pink-500 to-violet-500 rounded-2xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2">
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}

          {/* STEP 2: Credentials */}
          {step === 2 && (
            <div className="space-y-4">
              {referralApplied && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex items-center gap-2">
                  Gift Referral code applied - 7 bonus days incoming!
                </div>
              )}

              {/* Full name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                  <div className="relative flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                    <span className="absolute left-4 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <input className={inputCls} placeholder="John Smith" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                  <div className="relative flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                    <span className="absolute left-4 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </span>
                    <input className={inputCls} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                  <div className="relative flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                    <span className="absolute left-4 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.7 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012.62 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.34a16 16 0 006.72 6.72l.91-.91a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.61z"/></svg>
                    </span>
                    <input className={inputCls} type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                  <div className="relative flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                    <span className="absolute left-4 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </span>
                    <input className={`${inputCls} pr-12`} type={showPass ? 'text' : 'password'} placeholder="At least 6 characters" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors">
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= pwStrength.score ? pwStrength.color : '#e2e8f0' }} />
                    ))}
                    {pwStrength.label && <span className="text-xs font-medium" style={{ color: pwStrength.color }}>{pwStrength.label}</span>}
                  </div>
                )}
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 text-sm font-medium text-slate-600 hover:bg-white transition-all">
                  Back
                </button>
                <button type="button" onClick={nextStep}
                  className="flex-1 py-4 bg-gradient-to-r from-rose-400 via-pink-500 to-violet-500 rounded-2xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Location + Finalize */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Country + City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Country</label>
                  <div className="relative group">
                    <div className="flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                      <select className={`${inputCls} pl-4`} value={form.country} onChange={e => setForm({ ...form, country: e.target.value, city: '' })}>
                        <option value="">Select...</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <div className="relative group">
                    <div className="flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                      {cities.length > 0 ? (
                        <select className={`${inputCls} pl-4`} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                          <option value="">Select...</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input className={`${inputCls} pl-4`} placeholder={form.country ? 'Enter city...' : 'Country first'} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} disabled={!form.country} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotel picker for hotel_owner */}
              {form.role === 'hotel_owner' && (
                <div className="p-4 bg-pink-50 rounded-2xl border border-pink-200 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Select your hotel</p>
                  <div className="relative group">
                    <div className="flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl">
                      <input className={inputCls} placeholder="Search by name or city..." value={hotelSearch} onChange={e => setHotelSearch(e.target.value)} />
                    </div>
                  </div>
                  {selectedHotel ? (
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-200">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-800">{selectedHotel.name}</p>
                        <p className="text-xs text-slate-500">{selectedHotel.city}, {selectedHotel.country}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedHotel(null)} className="text-xs text-pink-500 hover:text-pink-600">Change</button>
                    </div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {!hotelsLoaded && <div className="text-center py-2"><span className="animate-spin w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full inline-block" /></div>}
                      {hotelsLoaded && filteredHotels.slice(0, 5).map(h => (
                        <button key={h.id} type="button" onClick={() => setSelectedHotel(h)} className="w-full p-2 rounded-xl border border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50 text-left text-sm text-slate-700 transition-all">
                          {h.name} <span className="text-slate-400">- {h.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Account Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800">{form.fullName || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800 truncate max-w-32">{form.email || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-medium text-slate-800">{form.role === 'traveler' ? 'Traveler' : 'Hotel Host'}</span></div>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 text-sm font-medium text-slate-600 hover:bg-white transition-all">Back</button>
                <button type="button" onClick={submit} disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-rose-400 via-pink-500 to-violet-500 rounded-2xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-pink-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</> : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent hover:from-rose-600 hover:to-pink-600 transition-all">Sign in</Link>
          </p>
        </div>

        {/* Back to Home */}
        <Link href="/" className="mt-4 text-center text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 w-full justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100"><div className="animate-spin w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
