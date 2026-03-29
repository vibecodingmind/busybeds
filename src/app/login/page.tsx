'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ─── Hotel property images for the slideshow ───────────────────────────────
// Using high-quality Unsplash hotel photos with dark overlay for readability
const HOTEL_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
    title: 'Luxury Beachfront Resort',
    location: 'Mombasa, Kenya',
    tag: 'Ocean View',
  },
  {
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    title: 'Premium City Hotel',
    location: 'Nairobi, Kenya',
    tag: 'City Centre',
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    title: 'Safari Lodge & Spa',
    location: 'Masai Mara, Kenya',
    tag: 'Wildlife',
  },
  {
    url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
    title: 'Boutique Pool Villa',
    location: 'Diani Beach, Kenya',
    tag: 'Pool Access',
  },
  {
    url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
    title: 'Mountain Retreat',
    location: 'Mt. Kenya Region',
    tag: 'Nature',
  },
];

// ─── Icon components ────────────────────────────────────────────────────────
function EyeOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
    setTimeout(() => {
      setCurrent(idx);
      setTransitioning(false);
    }, 400);
  };

  const slide = HOTEL_SLIDES[current];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${slide.url})`,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(1.04)' : 'scale(1)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      />

      {/* Dark gradient overlay — ensures text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      {/* Extra bottom fade for content area */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Top bar — Logo + nav */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/light-logo.png" alt="BusyBeds" className="h-8 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
          <span className="text-xl font-bold text-white drop-shadow">BusyBeds</span>
        </Link>
        <Link
          href="/register"
          className="px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/25 transition-all"
        >
          Sign Up
        </Link>
      </div>

      {/* Bottom content — Property info + dots */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        {/* Property badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-medium mb-4"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease 0.2s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {slide.tag}
        </div>

        <h2
          className="text-3xl font-bold text-white leading-tight mb-1 drop-shadow-lg"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease 0.25s' }}
        >
          {slide.title}
        </h2>
        <p
          className="text-white/75 text-sm mb-6 flex items-center gap-1.5"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease 0.3s' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {slide.location}
        </p>

        {/* Slide indicator dots */}
        <div className="flex items-center gap-2">
          {HOTEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === current ? '28px' : '8px',
                height: '8px',
                background: idx === current ? '#ffffff' : 'rgba(255,255,255,0.4)',
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="absolute bottom-36 left-8 right-8 z-10 hidden xl:flex gap-8">
        {[
          { value: '500+', label: 'Partner Hotels' },
          { value: '50K+', label: 'Happy Travelers' },
          { value: '40%', label: 'Avg. Savings' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold text-white drop-shadow">{stat.value}</div>
            <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Login Form ─────────────────────────────────────────────────────────────
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
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) { setError('Too many attempts. Please wait a few minutes.'); return; }
        setError(data.error || 'Login failed');
        return;
      }
      const role = data.user?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'hotel_manager' || role === 'hotel_owner') router.push('/portal');
      else router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── LEFT: Hotel Image Slideshow ── */}
      <div className="hidden lg:block lg:w-[52%] xl:w-[55%] relative">
        <ImagePanel />
      </div>

      {/* ── RIGHT: Login Form ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#1B4D3E] px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/light-logo.png" alt="BusyBeds" className="h-7 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            <span className="text-lg font-bold text-white">BusyBeds</span>
          </Link>
          <Link href="/register" className="text-white/80 text-sm font-medium">Sign Up</Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-[28px] font-bold text-slate-900 mb-1.5">Welcome Back to BusyBeds!</h1>
              <p className="text-slate-500 text-sm">Sign in to your account</p>
            </div>

            {/* Status banners */}
            {verified && (
              <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Email verified! You can now sign in.
              </div>
            )}
            {tokenError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                Invalid or expired link. Please{' '}
                <Link href="/register" className="underline font-medium">register again</Link>.
              </div>
            )}
            {rateLimited && (
              <div className="mb-5 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">
                Too many attempts. Please wait before trying again.
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3.5 pr-12 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, remember: !form.remember })}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer ${form.remember ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}
                  >
                    {form.remember && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-600">Remember Me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl text-white font-semibold text-sm tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Signing in...
                  </>
                ) : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium tracking-wide">Instan Login</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </a>
              <button
                disabled
                title="Coming soon"
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed opacity-70"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Continue with Facebook</span>
              </button>
            </div>

            {/* Register link */}
            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have any account?{' '}
              <Link href="/register" className="font-semibold text-slate-900 hover:underline transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
