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

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function CitySkyline() {
  return (
    <svg className="w-full h-auto" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Buildings - back row */}
      <rect x="20" y="80" width="40" height="120" fill="#2D5A4A" opacity="0.6"/>
      <rect x="70" y="50" width="35" height="150" fill="#3A6B5A" opacity="0.5"/>
      <rect x="115" y="70" width="45" height="130" fill="#2D5A4A" opacity="0.6"/>
      <rect x="170" y="40" width="50" height="160" fill="#3A6B5A" opacity="0.5"/>
      <rect x="230" y="60" width="40" height="140" fill="#2D5A4A" opacity="0.6"/>
      <rect x="280" y="30" width="55" height="170" fill="#3A6B5A" opacity="0.5"/>
      <rect x="345" y="70" width="45" height="130" fill="#2D5A4A" opacity="0.6"/>
      
      {/* Windows on buildings */}
      <rect x="28" y="90" width="6" height="8" fill="#1B4D3E" opacity="0.8"/>
      <rect x="40" y="90" width="6" height="8" fill="#1B4D3E" opacity="0.8"/>
      <rect x="28" y="105" width="6" height="8" fill="#1B4D3E" opacity="0.8"/>
      <rect x="40" y="105" width="6" height="8" fill="#1B4D3E" opacity="0.8"/>
      <rect x="28" y="120" width="6" height="8" fill="#1B4D3E" opacity="0.8"/>
      <rect x="40" y="120" width="6" height="8" fill="#1B4D3E" opacity="0.8"/>
      
      <rect x="180" y="55" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="195" y="55" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="210" y="55" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="180" y="75" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="195" y="75" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="210" y="75" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      
      <rect x="290" y="45" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="305" y="45" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="320" y="45" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="290" y="65" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="305" y="65" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="320" y="65" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="290" y="85" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="305" y="85" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      <rect x="320" y="85" width="8" height="10" fill="#1B4D3E" opacity="0.8"/>
      
      {/* Trees */}
      <ellipse cx="85" cy="190" rx="12" ry="18" fill="#4A7C59" opacity="0.7"/>
      <rect x="83" y="188" width="4" height="12" fill="#3D6B4A"/>
      
      <ellipse cx="260" cy="192" rx="10" ry="15" fill="#4A7C59" opacity="0.7"/>
      <rect x="258" y="190" width="4" height="10" fill="#3D6B4A"/>
      
      <ellipse cx="355" cy="193" rx="8" ry="12" fill="#4A7C59" opacity="0.7"/>
      <rect x="353" y="191" width="4" height="9" fill="#3D6B4A"/>
      
      {/* People silhouettes */}
      <ellipse cx="130" cy="195" rx="4" ry="5" fill="#4A7C59" opacity="0.6"/>
      <rect x="128" y="199" width="4" height="8" fill="#4A7C59" opacity="0.6" rx="1"/>
      
      <ellipse cx="200" cy="196" rx="3" ry="4" fill="#4A7C59" opacity="0.6"/>
      <rect x="198" y="199" width="4" height="7" fill="#4A7C59" opacity="0.6" rx="1"/>
      
      <ellipse cx="320" cy="195" rx="4" ry="5" fill="#4A7C59" opacity="0.6"/>
      <rect x="318" y="199" width="4" height="8" fill="#4A7C59" opacity="0.6" rx="1"/>
      
      {/* Ground line */}
      <rect x="0" y="198" width="400" height="2" fill="#2D5A4A" opacity="0.4"/>
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
      {/* Left Panel - Login Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile Header Strip */}
        <div className="lg:hidden bg-[#1B4D3E] px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">BusyBeds</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            
            {/* Desktop Logo */}
            <Link href="/" className="hidden lg:flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4D3E] flex items-center justify-center shadow-lg">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-800">BusyBeds</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Sign In</h1>
              <p className="text-slate-500">Welcome back! Please enter your details to continue</p>
            </div>

            {/* Status Messages */}
            {verified && (
              <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Email verified! You can now sign in.
              </div>
            )}
            {tokenError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                Invalid or expired link. Please{' '}
                <Link href="/register" className="underline font-medium hover:text-red-800">register again</Link>.
              </div>
            )}
            {rateLimited && (
              <div className="mb-5 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">
                Too many attempts. Please wait before trying again.
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <GoogleIcon />
                Sign in with Google
              </a>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-sm text-slate-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={submit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MailIcon />
                  </div>
                  <input
                    type="email" required
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-slate-500 hover:text-[#1B4D3E] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <LockIcon />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'} required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all"
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

              {/* Remember Me */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={e => setForm({ ...form, remember: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#1B4D3E] focus:ring-[#1B4D3E] focus:ring-offset-0"
                />
                <span className="text-sm text-slate-600">Remember Me</span>
              </label>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
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
                className="w-full py-3.5 bg-[#1B4D3E] hover:bg-[#2D6A4F] rounded-xl text-white font-semibold tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#1B4D3E]/20"
              >
                {loading ? (
                  <>
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Register Link */}
            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-[#1B4D3E] hover:text-[#2D6A4F] transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Testimonial (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-[#1B4D3E] relative overflow-hidden flex-col justify-between p-12">
        {/* Opening Quote Mark */}
        <div className="mb-8">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="text-[#D4A843]">
            <path d="M10 11L6 11C6 8.23858 8.23858 6 11 6L11 8C9.34315 8 8 9.34315 8 11L10 11C10.5523 11 11 11.4477 11 12L11 16C11 16.5523 10.5523 17 10 17L6 17C5.44772 17 5 16.5523 5 16L5 12C5 11.4477 5.44772 11 6 11Z" fill="currentColor"/>
            <path d="M20 11L16 11C16 8.23858 18.2386 6 21 6L21 8C19.3431 8 18 9.34315 18 11L20 11C20.5523 11 21 11.4477 21 12L21 16C21 16.5523 20.5523 17 20 17L16 17C15.4477 17 15 16.5523 15 16L15 12C15 11.4477 15.4477 11 16 11Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Testimonial Text */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative">
            <p className="text-2xl xl:text-3xl text-white font-medium leading-relaxed">
              Seamless booking experience! The app makes finding and reserving rooms so easy. I loved the instant confirmation and personalized recommendations. Definitely my go-to for all future stays.
            </p>
            {/* Closing Quote Mark */}
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-[#D4A843] absolute -bottom-10 right-0">
              <path d="M14 13L18 13C18 15.7614 15.7614 18 13 18L13 16C14.6569 16 16 14.6569 16 13L14 13C13.4477 13 13 12.5523 13 12L13 8C13 7.44772 13.4477 7 14 7L18 7C18.5523 7 19 7.44772 19 8L19 12C19 12.5523 18.5523 13 18 13Z" fill="currentColor"/>
              <path d="M4 13L8 13C8 15.7614 5.76142 18 3 18L3 16C4.65685 16 6 14.6569 6 13L4 13C3.44772 13 3 12.5523 3 12L3 8C3 7.44772 3.44772 7 4 7L8 7C8.55228 7 9 7.44772 9 8L9 12C9 12.5523 8.55228 13 8 13Z" fill="currentColor"/>
            </svg>
          </div>

          {/* Reviewer */}
          <div className="flex items-center gap-4 mt-12">
            <div className="w-14 h-14 rounded-full bg-[#D4A843] flex items-center justify-center text-white font-bold text-lg">
              AM
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Alex Mitchell</p>
              <p className="text-white/70 text-sm">Amsterdam</p>
            </div>
          </div>
        </div>

        {/* City Skyline Illustration */}
        <div className="mt-8 -mx-12 -mb-12">
          <CitySkyline />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
