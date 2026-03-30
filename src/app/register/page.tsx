'use client';
import { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { COUNTRIES, getCities } from '@/lib/locations';

// ─── Hotel slideshow — different set from login for variety ─────────────────
const HOTEL_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
    title: 'Rooftop Infinity Pool Hotel',
    location: 'Nairobi, Kenya',
    tag: 'Rooftop Bar',
  },
  {
    url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
    title: 'Coastal Beachfront Suites',
    location: 'Mombasa, Kenya',
    tag: 'Beach Access',
  },
  {
    url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1200&q=80',
    title: 'Executive Business Hotel',
    location: 'Kampala, Uganda',
    tag: 'Business Class',
  },
  {
    url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80',
    title: 'Eco Safari Tented Lodge',
    location: 'Amboseli, Kenya',
    tag: 'Eco Stay',
  },
  {
    url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
    title: 'Grand Heritage Hotel',
    location: 'Stone Town, Zanzibar',
    tag: 'Heritage',
  },
];

// ─── Icon components ────────────────────────────────────────────────────────
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

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function SuitcaseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M3 21h18"/>
      <path d="M5 21V7l8-4 8 4v14"/>
      <path d="M9 21v-6h2v6"/>
      <path d="M13 21v-6h2v6"/>
      <path d="M9 9h2v2H9z"/>
      <path d="M13 9h2v2h-2z"/>
    </svg>
  );
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

const ROLE_OPTIONS = [
  { value: 'traveler', icon: <SuitcaseIcon />, title: 'Traveler', desc: 'I want hotel discounts' },
  { value: 'hotel_owner', icon: <BuildingIcon />, title: 'Hotel Owner', desc: 'I want to list my hotel' },
];

// ─── Searchable Select ───────────────────────────────────────────────────────
function SearchableSelect({
  options, value, onChange, placeholder,
}: {
  options: string[]; value: string; onChange: (val: string) => void; placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-left focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all flex items-center justify-between"
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm focus:outline-none"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">No results</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                  className={`w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${value === opt ? 'bg-slate-50 font-medium text-slate-900' : 'text-slate-700'}`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const labels = ['Role', 'Details', 'Location'];
  return (
    <div className="flex items-center gap-2 mb-7">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              done ? 'bg-slate-900 text-white' : active ? 'border-2 border-slate-900 text-slate-900 bg-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {done
                ? <span className="w-3.5 h-3.5 flex items-center justify-center"><CheckIcon /></span>
                : <span className="w-3.5 h-3.5 flex items-center justify-center text-[11px]">{n}</span>
              }
              <span>{label}</span>
            </div>
            {n < 3 && <div className={`w-5 h-px rounded-full ${done ? 'bg-slate-900' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Image Slideshow Panel ───────────────────────────────────────────────────
function ImagePanel() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % HOTEL_SLIDES.length);
        setTransitioning(false);
      }, 600);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (idx: number) => {
    if (idx === current) return;
    setTransitioning(true);
    setTimeout(() => { setCurrent(idx); setTransitioning(false); }, 400);
  };

  const slide = HOTEL_SLIDES[current];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${slide.url})`,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(1.04)' : 'scale(1)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      />

      {/* Dark overlays — heavy enough for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/light-logo.png" alt="BusyBeds" className="h-8 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="text-xl font-bold text-white drop-shadow">BusyBeds</span>
        </Link>
        <Link
          href="/login"
          className="px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/25 transition-all"
        >
          Sign In
        </Link>
      </div>

      {/* Why join us — mid-panel perks (visible on xl) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 z-10 hidden xl:block">
        <p className="text-white/50 text-xs uppercase tracking-widest font-medium mb-4">Why join BusyBeds?</p>
        <div className="space-y-3">
          {[
            { icon: '🏨', text: '500+ partner hotels across East Africa' },
            { icon: '💳', text: 'Save up to 40% with QR coupons' },
            { icon: '⚡', text: 'Instant digital coupon delivery' },
            { icon: '🔒', text: 'Secure · Verified · Trusted' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span className="text-white/80 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-medium mb-4"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease 0.2s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {slide.tag}
        </div>

        <h2
          className="text-2xl font-bold text-white leading-tight mb-1 drop-shadow-lg"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease 0.25s' }}
        >
          {slide.title}
        </h2>
        <p
          className="text-white/70 text-sm mb-6 flex items-center gap-1.5"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease 0.3s' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {slide.location}
        </p>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {HOTEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === current ? '28px' : '8px',
                height: '8px',
                background: idx === current ? '#ffffff' : 'rgba(255,255,255,0.35)',
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Register Form ───────────────────────────────────────────────────────────
function RegisterForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: '', country: '', city: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const cities = getCities(form.country);
  const pwStrength = passwordStrength(form.password);

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
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: form.phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Registration failed'); return; }
      if (refCode) {
        try {
          await fetch('/api/referral/use', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: refCode }),
          });
        } catch (err) { console.error('Referral error:', err); }
      }
      // Hotel owners go directly to the apply page to list their hotel
      // Travelers go to subscribe to pick a plan
      if (form.role === 'hotel_owner') {
        router.push('/apply?welcome=1');
      } else {
        router.push('/subscribe?welcome=1');
      }
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── LEFT: Hotel Image Slideshow ── */}
      <div className="hidden lg:block lg:w-[52%] xl:w-[55%] relative">
        <ImagePanel />
      </div>

      {/* ── RIGHT: Registration Form ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#1B4D3E] px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/light-logo.png" alt="BusyBeds" className="h-7 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-lg font-bold text-white">BusyBeds</span>
          </Link>
          <Link href="/login" className="text-white/80 text-sm font-medium">Sign In</Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-[28px] font-bold text-slate-900 mb-1.5">Create Your Account</h1>
              <p className="text-slate-500 text-sm">Join BusyBeds and start saving on hotels</p>
            </div>

            {/* Step Indicator */}
            <StepIndicator step={step} />

            {/* ── STEP 1: Role selection ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map(opt => {
                    const selected = form.role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setForm({ ...form, role: opt.value }); setError(''); }}
                        className={`p-5 rounded-xl text-left transition-all border-2 ${
                          selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`mb-3 ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
                          {opt.icon}
                        </div>
                        <div className="font-semibold text-slate-800 text-sm mb-0.5">{opt.title}</div>
                        <div className="text-xs text-slate-500">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Info card — shown when hotel_owner is selected */}
                {form.role === 'hotel_owner' && (
                  <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-xl shrink-0">🏨</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-0.5">How listing works</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        After registering, you'll be taken to the <strong>Hotel Application form</strong> where you fill in your hotel details. Our team reviews and publishes your listing within 24–48 hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google */}
                <
                  href="/api/auth/google"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <GoogleIcon />
                  Continue with Google
                </a>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-slate-900 hover:underline">Sign In</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2: Credentials ── */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                    placeholder="John Smith"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3.5 pr-12 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                      type={showPass ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      minLength={6}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {form.password && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all"
                          style={{
                            background: i <= pwStrength.score
                              ? i === 1 ? '#EF4444' : i === 2 ? '#F97316' : i === 3 ? '#EAB308' : '#22C55E'
                              : '#e2e8f0',
                          }}
                        />
                      ))}
                      {pwStrength.label && (
                        <span className="text-xs font-medium ml-1" style={{ color: pwStrength.color }}>
                          {pwStrength.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Location + Finalize ── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                  <SearchableSelect
                    options={COUNTRIES}
                    value={form.country}
                    onChange={val => setForm({ ...form, country: val, city: '' })}
                    placeholder="Select country..."
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  {form.country && cities.length > 0 ? (
                    <SearchableSelect
                      options={cities}
                      value={form.city}
                      onChange={val => setForm({ ...form, city: val })}
                      placeholder="Select city..."
                    />
                  ) : (
                    <input
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={form.country ? 'Enter your city...' : 'Select a country first'}
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      disabled={!form.country}
                    />
                  )}
                </div>

                {/* Summary card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Summary</p>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Name', value: form.fullName || '—' },
                      { label: 'Email', value: form.email || '—' },
                      { label: 'Role', value: form.role === 'hotel_owner' ? 'Hotel Owner' : form.role ? 'Traveler' : '—' },
                      { label: 'Country', value: form.country || '—' },
                      { label: 'City', value: form.city || '—' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="font-medium text-slate-800 truncate max-w-[200px] text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Creating...
                      </>
                    ) : form.role === 'hotel_owner' ? 'Register & List My Hotel →' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}

            {/* Sign in link (steps 2 & 3) */}
            {step > 1 && (
              <p className="mt-7 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-slate-900 hover:underline">Sign In</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
