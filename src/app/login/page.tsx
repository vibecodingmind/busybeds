'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/>
    </svg>
  );
}

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
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")'
          }}
        />
        {/* Dark Overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">BusyBeds</span>
          </Link>

          {/* Hero Text */}
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
              Find Your Perfect Hotel Deal
            </h1>
            <p className="text-lg text-white leading-relaxed drop-shadow-md">
              Discover exclusive discounts at top hotels. Save up to 70% on your next booking with verified coupons.
            </p>
          </div>

          {/* Navigation Dots */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">BusyBeds</span>
          </Link>

          {/* Glass Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative backdrop-blur-xl bg-white/80 border border-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back to BusyBeds!</h2>
                <p className="text-slate-500">Sign in to your account</p>
              </div>

              {/* Status Messages */}
              {verified && (
                <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Email verified! You can now sign in.
                </div>
              )}
              {tokenError && (
                <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                  Invalid or expired link. Please{' '}
                  <Link href="/register" className="underline font-medium hover:text-red-800">register again</Link>.
                </div>
              )}
              {rateLimited && (
                <div className="mb-5 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-2xl text-sm">
                  Too many attempts. Please wait before trying again.
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Your Email</label>
                  <div className="relative">
                    <input
                      type="email" required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} required
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-5 py-4 pr-12 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
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

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={e => setForm({ ...form, remember: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-sm text-slate-600">Remember Me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-slate-500 hover:text-pink-500 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={loading}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 rounded-2xl text-white font-semibold tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Instant Login</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <a
                  href="/api/auth/google"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <GoogleIcon />
                  Continue with Google
                </a>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <LinkedInIcon />
                  Continue with LinkedIn
                </button>
              </div>

              {/* Register Link */}
              <p className="mt-6 text-center text-sm text-slate-500">
                Don&apos;t have any account?{' '}
                <Link href="/register" className="font-semibold text-pink-500 hover:text-pink-600 transition-colors">
                  Register
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <Link href="/" className="mt-4 text-center text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 w-full justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
