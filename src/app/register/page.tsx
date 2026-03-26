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
  if (!pw) return { score: 0, label: '', color: 'rgba(255,255,255,0.1)' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: '', color: 'rgba(255,255,255,0.1)' },
    { score: 1, label: 'Weak', color: '#EF4444' },
    { score: 2, label: 'Fair', color: '#F97316' },
    { score: 3, label: 'Good', color: '#EAB308' },
    { score: 4, label: 'Strong', color: '#22C55E' },
  ];
  return levels[score];
}

const inputCls = 'w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all disabled:opacity-50';

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
                background: done ? 'rgba(34, 197, 94, 0.2)' : active ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                color: done ? '#4ade80' : active ? 'white' : 'rgba(255,255,255,0.4)',
                border: done ? '1px solid rgba(34, 197, 94, 0.3)' : active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {done ? <CheckIcon /> : <span className="w-4 h-4 flex items-center justify-center">{n}</span>}
              <span>{label}</span>
            </div>
            {n < 3 && (
              <div className="w-8 h-0.5 rounded-full" style={{ background: done ? '#4ade80' : 'rgba(255,255,255,0.1)' }} />
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
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-3000" />
        </div>
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      </div>

      {/* Glass Card */}
      <div className="relative w-full max-w-md">
        {/* Glow Effect Behind Card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur-lg opacity-30 animate-pulse" />
        
        <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-transform duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">BusyBeds</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/60">Join thousands of smart travelers</p>
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
                      className={`p-5 rounded-2xl text-left transition-all border-2 ${selected ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
                    >
                      <div className="text-white/80 mb-3">{opt.icon}</div>
                      <div className="font-semibold text-white text-sm">{opt.title}</div>
                      <div className="text-xs text-white/50 mb-2">{opt.desc}</div>
                      {selected && (
                        <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                          <CheckIcon /> Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="text-xs text-white/40 font-medium">OR</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              <a href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all">
                <GoogleIcon /> Continue with Google
              </a>

              {error && <p className="text-red-400 text-sm bg-red-500/20 backdrop-blur-sm border border-red-500/30 px-4 py-3 rounded-xl">{error}</p>}

              <button type="button" onClick={nextStep}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2">
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}

          {/* STEP 2: Credentials */}
          {step === 2 && (
            <div className="space-y-4">
              {referralApplied && (
                <div className="p-3 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
                  Gift Referral code applied - 7 bonus days incoming!
                </div>
              )}

              {/* Full name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-white/40 group-focus-within:text-cyan-400 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <input className={inputCls} placeholder="John Smith" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-white/40 group-focus-within:text-cyan-400 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </span>
                    <input className={inputCls} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Phone <span className="text-white/40 font-normal">(optional)</span></label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-white/40 group-focus-within:text-cyan-400 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.7 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012.62 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.34a16 16 0 006.72 6.72l.91-.91a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.61z"/></svg>
                    </span>
                    <input className={inputCls} type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-white/40 group-focus-within:text-cyan-400 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </span>
                    <input className={`${inputCls} pr-12`} type={showPass ? 'text' : 'password'} placeholder="At least 6 characters" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-white/40 hover:text-white transition-colors">
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= pwStrength.score ? pwStrength.color : 'rgba(255,255,255,0.1)' }} />
                    ))}
                    {pwStrength.label && <span className="text-xs font-medium" style={{ color: pwStrength.color }}>{pwStrength.label}</span>}
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm bg-red-500/20 backdrop-blur-sm border border-red-500/30 px-4 py-3 rounded-xl">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-4 rounded-xl border border-white/10 text-sm font-medium text-white/70 hover:bg-white/5 transition-all">
                  Back
                </button>
                <button type="button" onClick={nextStep}
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2">
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
                  <label className="text-sm font-medium text-white/80">Country</label>
                  <select className={inputCls} value={form.country} onChange={e => setForm({ ...form, country: e.target.value, city: '' })}>
                    <option value="">Select...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">City</label>
                  {cities.length > 0 ? (
                    <select className={inputCls} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                      <option value="">Select...</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input className={inputCls} placeholder={form.country ? 'Enter city...' : 'Country first'} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} disabled={!form.country} />
                  )}
                </div>
              </div>

              {/* Hotel picker for hotel_owner */}
              {form.role === 'hotel_owner' && (
                <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20 space-y-3">
                  <p className="text-sm font-semibold text-white/90">Select your hotel</p>
                  <input className={inputCls} placeholder="Search by name or city..." value={hotelSearch} onChange={e => setHotelSearch(e.target.value)} />
                  {selectedHotel ? (
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-white">{selectedHotel.name}</p>
                        <p className="text-xs text-white/50">{selectedHotel.city}, {selectedHotel.country}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedHotel(null)} className="text-xs text-cyan-400 hover:text-cyan-300">Change</button>
                    </div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {!hotelsLoaded && <div className="text-center py-2"><span className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full inline-block" /></div>}
                      {hotelsLoaded && filteredHotels.slice(0, 5).map(h => (
                        <button key={h.id} type="button" onClick={() => setSelectedHotel(h)} className="w-full p-2 rounded-lg border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10 text-left text-sm text-white transition-all">
                          {h.name} <span className="text-white/40">- {h.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Account Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">Name</span><span className="font-medium text-white">{form.fullName || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Email</span><span className="font-medium text-white truncate max-w-32">{form.email || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Role</span><span className="font-medium text-white">{form.role === 'traveler' ? 'Traveler' : 'Hotel Host'}</span></div>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-500/20 backdrop-blur-sm border border-red-500/30 px-4 py-3 rounded-xl">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="px-5 py-4 rounded-xl border border-white/10 text-sm font-medium text-white/70 hover:bg-white/5 transition-all">Back</button>
                <button type="button" onClick={submit} disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</> : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-300 transition-all">Sign in</Link>
          </p>
        </div>

        {/* Back to Home */}
        <Link href="/" className="mt-4 text-center text-xs text-white/40 hover:text-white/60 transition-colors inline-flex items-center gap-1 w-full justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Home
        </Link>
      </div>

      {/* CSS for blob animation */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"><div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
