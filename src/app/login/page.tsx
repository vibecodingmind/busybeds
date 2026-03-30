'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Logo from '@/components/Logo';

// ─── Hotel slides ────────────────────────────────────────────────────────────
const HOTEL_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=85',
    headline: 'YOUR NEXT\nADVENTURE\nAWAITS!',
    sub: 'Log in to unlock exclusive deals, plan your dream escapes, and pick up where you left off.',
    tagline: 'Your journey starts here.',
  },
  {
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1400&q=85',
    headline: 'DISCOVER\nPREMIUM\nSTAYS',
    sub: 'Access curated hotel deals across East Africa. From city escapes to wild safaris.',
    tagline: 'Save up to 40% with BusyBeds.',
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85',
    headline: 'SLEEP\nBETTER,\nSAVE MORE',
    sub: 'Your BusyBeds subscription unlocks QR coupons at hundreds of partner hotels.',
    tagline: 'Scan. Save. Stay.',
  },
  {
    url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&q=85',
    headline: 'BEACH,\nBUSH OR\nBEYOND',
    sub: 'Whether it\'s mountains, beaches, or city lights — your perfect stay is waiting.',
    tagline: 'Find it on BusyBeds.',
  },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
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

// ─── Slideshow image panel (left card) ───────────────────────────────────────
function ImagePanel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(p => (p + 1) % HOTEL_SLIDES.length);
        setFading(false);
      }, 500);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const slide = HOTEL_SLIDES[current];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {/* Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${slide.url})`,
          opacity: fading ? 0 : 1,
          transform: fading ? 'scale(1.03)' : 'scale(1)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      />

      {/* Dark overlay — heavier at bottom so text pops */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/80" />

      {/* LOGO top-left */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Logo variant="light" height={36} />
        </Link>
      </div>

      {/* Bottom headline + sub */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <h2
          className="text-white font-black leading-none mb-4 drop-shadow-lg"
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            whiteSpace: 'pre-line',
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.4s ease 0.15s',
          }}
        >
          {slide.headline}
        </h2>
        <p
          className="text-white/75 text-sm leading-relaxed mb-1"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease 0.2s' }}
        >
          {slide.sub}
        </p>
        <p
          className="text-white/55 text-xs mb-6"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease 0.25s' }}
        >
          {slide.tagline}
        </p>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {HOTEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 400); }}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === current ? '24px' : '7px',
                height: '7px',
                borderRadius: '99px',
                background: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const verified = searchParams.get('verified') === '1';
  const tokenError = searchParams.get('error') === 'invalid_token';
  const rateLimited = searchParams.get('error') === 'rate_limit';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) { setError('Too many attempts. Please wait a few minutes.'); return; }
        setError(data.error || 'Login failed'); return;
      }
      const role = data.user?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'hotel_manager' || role === 'hotel_owner') router.push('/portal');
      else router.push(next);
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    /* ── Full-page dark blurred background ── */
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{
        background: 'linear-gradient(135deg, #0a0f0e 0%, #0d1f1a 40%, #091818 100%)',
      }}
    >
      {/* Subtle background texture blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #1B4D3E, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #0E7C7B, transparent)' }} />
      </div>

      {/* ── The floating card ── */}
      <div
        className="relative z-10 w-full flex overflow-hidden"
        style={{
          maxWidth: '960px',
          minHeight: '580px',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          background: '#fff',
        }}
      >
        {/* LEFT — image panel */}
        <div className="hidden lg:block w-[46%] shrink-0 p-3">
          <ImagePanel />
        </div>

        {/* RIGHT — form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 sm:px-12 overflow-y-auto">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <Logo variant="dark" height={32} />
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">WELCOME BACK !</h1>
            <p className="text-slate-400 text-sm">Welcome back! Please enter your details.</p>
          </div>

          {/* Status banners */}
          {verified && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Email verified! You can now sign in.
            </div>
          )}
          {tokenError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              Invalid or expired link. <Link href="/register" className="underline font-medium">Register again</Link>.
            </div>
          )}
          {rateLimited && (
            <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">
              Too many attempts. Please wait before trying again.
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email" required
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setForm({ ...form, remember: !form.remember })}
                  className={`w-4 h-4 rounded border transition-all cursor-pointer flex items-center justify-center ${form.remember ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}
                >
                  {form.remember && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-500">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                Forgot password
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Sign in button */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0d3b2e, #1B4D3E)' }}
            >
              {loading ? (
                <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Signing in...</>
              ) : 'Sign in'}
            </button>

            {/* Google */}
            <a
              href="/api/auth/google"
              className="w-full py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <GoogleIcon />
              Sign in with Google
            </a>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-slate-800 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
