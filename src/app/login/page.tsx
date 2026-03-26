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
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/25 transform hover:scale-105 transition-transform duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">BusyBeds</span>
            </Link>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
            <p className="text-slate-500">Sign in to continue your journey</p>
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
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                <div className="relative flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                  <span className="absolute left-4 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email" required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition-opacity" />
                <div className="relative flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
                  <span className="absolute left-4 text-slate-400 group-focus-within:text-pink-500 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'} required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-4 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={e => setForm({ ...form, remember: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded-lg peer-checked:bg-gradient-to-r peer-checked:from-rose-400 peer-checked:to-pink-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent hover:from-rose-600 hover:to-pink-600 transition-all"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
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

            {/* Submit Button */}
            <button
              type="submit" disabled={loading}
              className="relative w-full group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-pink-500 to-violet-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-full py-4 bg-gradient-to-r from-rose-400 via-pink-500 to-violet-500 rounded-2xl text-white font-semibold tracking-wide transition-all hover:shadow-lg hover:shadow-pink-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all"
            >
              <GoogleIcon />
              Google
            </a>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all"
            >
              <MicrosoftIcon />
              Microsoft
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent hover:from-rose-600 hover:to-pink-600 transition-all">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-3 backdrop-blur-xl bg-white/50 border border-white/80 rounded-2xl text-xs text-slate-500 text-center shadow-sm">
          <strong className="text-slate-700">Demo:</strong> admin@busybeds.com / admin123
        </div>

        {/* Back to Home */}
        <Link href="/" className="mt-4 text-center text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 w-full justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
