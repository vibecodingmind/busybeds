'use client';
import { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { COUNTRIES, getCities } from '@/lib/locations';


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

const ROLE_OPTIONS = [
  {
    value: 'traveler',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    ),
    title: 'Traveler',
    desc: 'I want hotel discounts',
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
                background: done ? '#dcfce7' : active ? '#0f172a' : '#f1f5f9',
                color: done ? '#16a34a' : active ? 'white' : '#94a3b8',
                border: done ? '1px solid #bbf7d0' : active ? '1px solid transparent' : '1px solid #e2e8f0',
              }}
            >
              {done ? <CheckIcon /> : <span className="w-4 h-4 flex items-center justify-center">{n}</span>}
              <span>{label}</span>
            </div>
            {n < 3 && (
              <div className="w-6 h-0.5 rounded-full" style={{ background: done ? '#22c55e' : '#e2e8f0' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Searchable Select Component
function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: string[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm text-left focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all flex items-center justify-between"
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">No results found</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                  className={`w-full px-4 py-2.5 text-sm text-left hover:bg-pink-50 transition-colors ${value === opt ? 'bg-pink-50 text-pink-600 font-medium' : 'text-slate-700'}`}
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
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
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
      router.push('/subscribe');
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")'
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
              Start Saving on Hotels Today
            </h1>
            <p className="text-lg text-white leading-relaxed drop-shadow-md">
              Join thousands of travelers getting exclusive discounts. Create your free account in seconds.
            </p>
          </div>

          {/* Navigation Dots */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-6 lg:hidden">
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
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Your Account</h2>
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
                          className={`p-5 rounded-2xl text-left transition-all border-2 ${selected ? 'border-pink-400 bg-pink-50 shadow-lg shadow-pink-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}
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
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">OR</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <a href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    <GoogleIcon /> Continue with Google
                  </a>

                  <button type="button"
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    <LinkedInIcon /> Continue with LinkedIn
                  </button>

                  {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}

                  <button type="button" onClick={nextStep}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 rounded-2xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
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
                    <label className="text-sm font-medium text-slate-600">Full Name</label>
                    <input 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
                      placeholder="John Smith" 
                      value={form.fullName} 
                      onChange={e => setForm({ ...form, fullName: e.target.value })} 
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Email Address</label>
                    <input 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
                      type="email" 
                      placeholder="you@example.com" 
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })} 
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
                      type="tel" 
                      placeholder="+1 555 000 0000" 
                      value={form.phone} 
                      onChange={e => setForm({ ...form, phone: e.target.value })} 
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Password</label>
                    <div className="relative">
                      <input 
                        className="w-full px-5 py-4 pr-12 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
                        type={showPass ? 'text' : 'password'} 
                        placeholder="At least 6 characters" 
                        minLength={6} 
                        value={form.password} 
                        onChange={e => setForm({ ...form, password: e.target.value })} 
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        <EyeIcon open={showPass} />
                      </button>
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
                    <button type="button" onClick={() => setStep(1)} className="px-5 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                      Back
                    </button>
                    <button type="button" onClick={nextStep}
                      className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 rounded-2xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                      Continue
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Location + Finalize */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Country + City with Searchable Dropdowns */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Country</label>
                      <SearchableSelect
                        options={COUNTRIES}
                        value={form.country}
                        onChange={val => setForm({ ...form, country: val, city: '' })}
                        placeholder="Select country..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">City</label>
                      {form.country && cities.length > 0 ? (
                        <SearchableSelect
                          options={cities}
                          value={form.city}
                          onChange={val => setForm({ ...form, city: val })}
                          placeholder="Select city..."
                        />
                      ) : (
                        <input
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all disabled:opacity-50"
                          placeholder={form.country ? 'Enter city...' : 'Select country first'}
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          disabled={!form.country}
                        />
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Account Summary</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800">{form.fullName || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800 truncate max-w-32">{form.email || '-'}</span></div>
                    </div>
                  </div>

                  {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">{error}</p>}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="px-5 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                    <button type="button" onClick={submit} disabled={loading}
                      className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 rounded-2xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                      {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</> : 'Create Account'}
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-pink-500 hover:text-pink-600 transition-colors">Sign in</Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <Link href="/" className="mt-4 text-center text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 w-full justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"><div className="animate-spin w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
