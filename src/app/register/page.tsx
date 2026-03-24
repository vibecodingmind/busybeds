'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { COUNTRIES, getCities } from '@/lib/locations';

interface Hotel { id: string; name: string; city: string; country: string; starRating: number; }

// ── Per-step hero content ────────────────────────────────────────────────────
const STEP_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&auto=format&fit=crop&q=80',
    tag: 'Step 1 of 3',
    title: 'How will you\nuse BusyBeds?',
    subtitle: "Choose your role and we'll tailor your experience from the start.",
  },
  {
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&auto=format&fit=crop&q=80',
    tag: 'Step 2 of 3',
    title: 'Create your\nidentity',
    subtitle: 'Your details are safe with us. We never sell or share personal data.',
  },
  {
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1400&auto=format&fit=crop&q=80',
    tag: 'Step 3 of 3',
    title: "You're almost\nthere!",
    subtitle: 'Last step — just your location and you start saving immediately.',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#E5E7EB' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: '', color: '#E5E7EB' },
    { score: 1, label: 'Weak',   color: '#EF4444' },
    { score: 2, label: 'Fair',   color: '#F97316' },
    { score: 3, label: 'Good',   color: '#EAB308' },
    { score: 4, label: 'Strong', color: '#22C55E' },
  ];
  return levels[score];
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed';

const ROLE_OPTIONS = [
  {
    value: 'traveler',
    emoji: '✈️',
    title: 'Traveler',
    desc: 'I want hotel discounts',
    perks: ['Unique QR discount coupons', 'Save & compare hotels', 'Share coupons with friends', 'Refer & earn bonus days'],
    gradient: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)',
  },
  {
    value: 'hotel_owner',
    emoji: '🏨',
    title: 'Hotel Host',
    desc: 'I manage a property',
    perks: ['Manage your hotel listing', 'Set custom discounts', 'Track coupon redemptions', 'Download usage reports'],
    gradient: 'linear-gradient(135deg, #7C3AED, #2563EB)',
  },
];

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const labels = ['Your role', 'Your info', 'Location'];
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-1.5 flex-1 last:flex-none">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap"
              style={{
                background: done ? '#DCFCE7' : active ? '#111827' : '#F3F4F6',
                color: done ? '#166534' : active ? 'white' : '#9CA3AF',
              }}
            >
              {done ? <CheckIcon /> : (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : 'transparent' }}
                >
                  {n}
                </span>
              )}
              {active && <span>{label}</span>}
            </div>
            {n < 3 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-all duration-500"
                style={{ background: done ? '#4ADE80' : '#E5E7EB' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: '', country: '', city: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralApplied, setReferralApplied] = useState(false);

  // Hotel claim state
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

  const goTo = (n: number) => {
    if (animating) return;
    setDirection(n > step ? 'forward' : 'back');
    setAnimating(true);
    setError('');
    setTimeout(() => {
      setStep(n);
      setAnimating(false);
    }, 220);
  };

  const nextStep = () => {
    if (step === 1 && !form.role) { setError('Please choose your role to continue.'); return; }
    if (step === 2) {
      if (!form.fullName.trim()) { setError('Full name is required.'); return; }
      if (!form.email.trim()) { setError('Email is required.'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }
    goTo(step + 1);
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

  const slide = STEP_SLIDES[step - 1];

  // Slide animation styles
  const stepStyle: React.CSSProperties = {
    opacity: animating ? 0 : 1,
    transform: animating
      ? `translateX(${direction === 'forward' ? '24px' : '-24px'})`
      : 'translateX(0)',
    transition: 'opacity 0.22s ease, transform 0.22s ease',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* ── Left panel — hero ──────────────────────────────────────────────── */}
      <div className="hidden lg:block relative w-[46%] flex-shrink-0 overflow-hidden">
        {STEP_SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${s.image})`,
              opacity: i === step - 1 ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />

        {/* Logo */}
        <Link href="/" className="absolute top-7 left-8 flex items-center gap-3 z-10 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Busy Beds</span>
        </Link>

        {/* Free to join badge */}
        <div className="absolute top-7 right-6 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <span>🎁</span> Free to join
          </div>
        </div>

        {/* Step content at bottom */}
        <div className="absolute bottom-10 left-8 right-8 z-10">
          {STEP_SLIDES.map((s, i) => (
            <div key={i} style={{
              opacity: i === step - 1 ? 1 : 0,
              transform: i === step - 1 ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
              position: i === 0 ? 'relative' : 'absolute', top: 0, left: 0, right: 0,
              pointerEvents: i === step - 1 ? 'auto' : 'none',
            }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white/70 bg-white/10 border border-white/20 mb-3">
                {s.tag}
              </div>
              <h2 className="text-white text-[2rem] font-bold leading-tight mb-2 whitespace-pre-line">{s.title}</h2>
              <p className="text-white/65 text-sm leading-relaxed">{s.subtitle}</p>
            </div>
          ))}
          <div style={{ height: 130 }} />

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                style={{
                  width: n === step ? 28 : 8, height: 8, borderRadius: 4,
                  background: n === step ? 'white' : n < step ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.35s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">

        {/* Top nav */}
        <div className="flex items-center justify-between px-8 pt-7 pb-2 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A3C5E' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-base" style={{ color: '#1A3C5E' }}>Busy Beds</span>
          </Link>
          <Link href="/login"
            className="text-sm font-semibold px-5 py-2 rounded-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all">
            Sign in
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <div className="w-full max-w-md">

            {/* Step indicator */}
            <StepIndicator step={step} />

            {/* Animated step content */}
            <div style={stepStyle}>

              {/* ─────── STEP 1: Role selection ─────── */}
              {step === 1 && (
                <div>
                  <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-1">What brings you here?</h1>
                    <p className="text-gray-500 text-sm">Pick your role — you can change it later in settings.</p>
                  </div>

                  {/* Role cards */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    {ROLE_OPTIONS.map(opt => {
                      const selected = form.role === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setForm({ ...form, role: opt.value }); setError(''); }}
                          className="relative p-5 rounded-2xl text-left transition-all border-2 group overflow-hidden"
                          style={{
                            borderColor: selected ? '#111827' : '#E5E7EB',
                            background: selected ? '#F9FAFB' : 'white',
                            boxShadow: selected ? '0 0 0 3px rgba(17,24,39,0.08)' : undefined,
                          }}
                        >
                          {/* Selected check */}
                          {selected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}

                          {/* Emoji in gradient circle */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110"
                            style={{ background: selected ? opt.gradient : '#F3F4F6' }}
                          >
                            {opt.emoji}
                          </div>

                          <div className="font-bold text-gray-900 mb-0.5">{opt.title}</div>
                          <div className="text-xs text-gray-500 mb-3">{opt.desc}</div>

                          {/* Perks */}
                          <div className="space-y-1">
                            {opt.perks.map(perk => (
                              <div key={perk} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div
                                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: selected ? '#DCFCE7' : '#F3F4F6' }}
                                >
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={selected ? '#16A34A' : '#9CA3AF'} strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                                {perk}
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Google start */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">or quick start</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <a href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-5">
                    <GoogleIcon /> Continue with Google
                  </a>

                  {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-4">{error}</p>}

                  <button
                    type="button" onClick={nextStep}
                    className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: form.role ? '#111827' : '#D1D5DB', cursor: form.role ? 'pointer' : 'not-allowed' }}
                  >
                    Continue as {form.role === 'traveler' ? 'Traveler' : form.role === 'hotel_owner' ? 'Hotel Host' : '…'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}

              {/* ─────── STEP 2: Credentials ─────── */}
              {step === 2 && (
                <div>
                  <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-1">Tell us about yourself</h1>
                    <p className="text-gray-500 text-sm">These details secure your account and personalize your experience.</p>
                  </div>

                  {referralApplied && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                      <span>🎁</span><span>Referral code applied — 7 bonus days incoming!</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Full name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </span>
                        <input
                          className={`${inputCls} pl-9`}
                          placeholder="John Smith"
                          value={form.fullName}
                          onChange={e => setForm({ ...form, fullName: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </span>
                        <input
                          className={`${inputCls} pl-9`}
                          type="email" placeholder="you@example.com"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone <span className="text-gray-400 font-normal text-xs">(optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.7 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012.62 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.34a16 16 0 006.72 6.72l.91-.91a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.61z"/></svg>
                        </span>
                        <input
                          className={`${inputCls} pl-9`}
                          type="tel" placeholder="+1 555 000 0000"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          className={`${inputCls} pr-12`}
                          type={showPass ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          minLength={6}
                          value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          <EyeIcon open={showPass} />
                        </button>
                      </div>
                      {/* Strength meter */}
                      {form.password && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            {[1, 2, 3, 4].map(i => (
                              <div
                                key={i}
                                className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                style={{ background: i <= pwStrength.score ? pwStrength.color : '#E5E7EB' }}
                              />
                            ))}
                            {pwStrength.label && (
                              <span className="text-xs font-semibold ml-1" style={{ color: pwStrength.color }}>
                                {pwStrength.label}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl mt-4">{error}</p>}

                  <div className="flex gap-3 mt-5">
                    <button type="button" onClick={() => goTo(1)}
                      className="px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-800 transition-colors flex items-center gap-1.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                      Back
                    </button>
                    <button type="button" onClick={nextStep}
                      className="flex-1 py-3 rounded-xl text-white text-sm font-bold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{ background: '#111827' }}>
                      Continue
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* ─────── STEP 3: Location + Finalize ─────── */}
              {step === 3 && (
                <div>
                  <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-1">
                      {form.role === 'hotel_owner' ? 'Your hotel & location' : 'Where are you based?'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                      {form.role === 'hotel_owner'
                        ? 'Select your hotel and location so we can verify your claim.'
                        : 'Help us show you relevant hotels near you.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Country + City grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                        <select
                          className={inputCls}
                          value={form.country}
                          onChange={e => setForm({ ...form, country: e.target.value, city: '' })}
                        >
                          <option value="">Select…</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                        {cities.length > 0 ? (
                          <select className={inputCls} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                            <option value="">Select…</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <input
                            className={inputCls}
                            placeholder={form.country ? 'Enter city…' : 'Country first'}
                            value={form.city}
                            onChange={e => setForm({ ...form, city: e.target.value })}
                            disabled={!form.country}
                          />
                        )}
                      </div>
                    </div>

                    {/* Hotel picker for hotel_owner */}
                    {form.role === 'hotel_owner' && (
                      <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          </div>
                          <p className="text-xs font-semibold text-gray-700">Select the hotel you represent</p>
                        </div>
                        <input
                          className={inputCls}
                          placeholder="Search by hotel name or city…"
                          value={hotelSearch}
                          onChange={e => setHotelSearch(e.target.value)}
                        />
                        {selectedHotel ? (
                          <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">🏨</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate">{selectedHotel.name}</p>
                              <p className="text-xs text-gray-500">{selectedHotel.city}, {selectedHotel.country}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedHotel(null)}
                              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
                            {!hotelsLoaded && (
                              <div className="flex justify-center py-4">
                                <span className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                              </div>
                            )}
                            {hotelsLoaded && filteredHotels.length === 0 && (
                              <p className="text-xs text-gray-400 text-center py-3">No hotels found.{' '}
                                <Link href="/?suggest=1" target="_blank" className="underline">Suggest yours to admin</Link>
                              </p>
                            )}
                            {filteredHotels.map(h => (
                              <button key={h.id} type="button" onClick={() => setSelectedHotel(h)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs text-gray-800 truncate">{h.name}</p>
                                  <p className="text-xs text-gray-400">📍 {h.city}, {h.country}</p>
                                </div>
                                <span className="text-yellow-400 text-xs flex-shrink-0">{'★'.repeat(h.starRating)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Account summary card */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Account Summary</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Name</span>
                          <span className="text-xs font-semibold text-gray-800">{form.fullName || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Email</span>
                          <span className="text-xs font-semibold text-gray-800 max-w-[180px] truncate">{form.email || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Role</span>
                          <span className="text-xs font-semibold text-gray-800">
                            {form.role === 'traveler' ? '✈️ Traveler' : form.role === 'hotel_owner' ? '🏨 Hotel Host' : '—'}
                          </span>
                        </div>
                      </div>
                      <button type="button" onClick={() => goTo(2)}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit details
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl mt-4">{error}</p>}

                  <div className="flex gap-3 mt-5">
                    <button type="button" onClick={() => goTo(2)}
                      className="px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-800 transition-colors flex items-center gap-1.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                      Back
                    </button>
                    <button
                      type="button" onClick={submit} disabled={loading}
                      className="flex-1 py-3 rounded-xl text-white text-sm font-bold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ background: '#111827' }}>
                      {loading
                        ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating…</>
                        : <><span>🎉</span> Create My Account</>}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom links */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-gray-900 hover:underline">Sign in</Link>
            </p>
            <p className="mt-3 text-center">
              <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 transition-colors inline-flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Home
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
