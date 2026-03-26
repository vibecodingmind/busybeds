'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
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
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #E0F2FE 100%)" }}>
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-center px-12 xl:px-20">
        <div className="max-w-lg">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 group">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold" style={{ color: "#1E40AF" }}>BusyBeds</span>
          </Link>

          {/* Main Heading */}
          <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-6">
            The Only Platform You Need for{' '}
            <span style={{ color: "#3B82F6" }}>Hotel Discounts</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-gray-600 leading-relaxed mb-10">
            Create once, publish everywhere. Get exclusive coupons for top hotels across Africa and save up to 70% on every booking.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#DBEAFE" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-gray-700 font-medium">Verified QR Coupons</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#DBEAFE" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-gray-700 font-medium">Save & Compare Hotels</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#DBEAFE" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-gray-700 font-medium">22% Average Savings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold" style={{ color: "#1E40AF" }}>BusyBeds</span>
          </Link>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-500">Sign in to access your dashboard</p>
            </div>

            {/* Status banners */}
            {verified && (
              <div className="mb-5 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
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

            <form onSubmit={submit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email" required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'} required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>

                {/* Remember + Forgot row */}
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={e => setForm({ ...form, remember: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold tracking-wide transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
              >
                {loading
                  ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Signing in...</>
                  : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR CONTINUE WITH</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google OAuth */}
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <GoogleIcon />
              Continue with Google
            </a>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl text-xs text-gray-600 text-center border border-gray-100">
            <strong className="text-gray-700">Demo:</strong> admin@busybeds.com / admin123 &nbsp;|&nbsp; traveler@demo.com / demo123
          </div>

          {/* Back to home */}
          <p className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
