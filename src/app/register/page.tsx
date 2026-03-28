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

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <polyline points="2,5 12,13 22,5"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function SuitcaseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="6" y="4" width="12" height="16" rx="2"/>
      <path d="M12 8v8"/>
      <path d="M9 4V2"/>
      <path d="M15 4V2"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
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
  {
    value: 'traveler',
    icon: <SuitcaseIcon />,
    title: 'Traveler',
    desc: 'I want hotel discounts',
  },
  {
    value: 'hotel_owner',
    icon: <BuildingIcon />,
    title: 'Hotel Owner',
    desc: 'I want to list my hotel',
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                done
                  ? 'bg-emerald-600 text-white'
                  : active
                  ? 'border-2 border-emerald-600 text-emerald-700 bg-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? <CheckIcon /> : <span className="w-4 h-4 flex items-center justify-center">{n}</span>}
              <span>{label}</span>
            </div>
            {n < 3 && (
              <div className={`w-6 h-0.5 rounded-full ${done ? 'bg-emerald-600' : 'bg-slate-200'}`} />
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
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-left focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all flex items-center justify-between"
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                  className={`w-full px-4 py-2.5 text-sm text-left hover:bg-emerald-50 transition-colors ${value === opt ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'}`}
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

// City Skyline SVG Illustration
function CitySkylineIllustration() {
  return (
    <svg viewBox="0 0 400 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background hills */}
      <path d="M0 200 L0 150 Q50 120 100 140 Q150 160 200 130 Q250 100 300 120 Q350 140 400 110 L400 200 Z" fill="#2D6A4F" opacity="0.3"/>
      
      {/* Building 1 - Tall modern tower */}
      <rect x="40" y="60" width="35" height="140" rx="2" fill="#4A9B7F"/>
      <rect x="45" y="70" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      <rect x="58" y="70" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      <rect x="45" y="90" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      <rect x="58" y="90" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      <rect x="45" y="110" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      <rect x="58" y="110" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      <rect x="45" y="130" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      <rect x="58" y="130" width="8" height="12" rx="1" fill="#7BC4A8" opacity="0.5"/>
      
      {/* Building 2 - Medium office */}
      <rect x="85" y="90" width="45" height="110" rx="2" fill="#5BA88C"/>
      <rect x="92" y="100" width="10" height="8" rx="1" fill="#8DD4B8" opacity="0.4"/>
      <rect x="108" y="100" width="10" height="8" rx="1" fill="#8DD4B8" opacity="0.4"/>
      <rect x="92" y="115" width="10" height="8" rx="1" fill="#8DD4B8" opacity="0.4"/>
      <rect x="108" y="115" width="10" height="8" rx="1" fill="#8DD4B8" opacity="0.4"/>
      <rect x="92" y="130" width="10" height="8" rx="1" fill="#8DD4B8" opacity="0.4"/>
      <rect x="108" y="130" width="10" height="8" rx="1" fill="#8DD4B8" opacity="0.4"/>
      
      {/* Building 3 - Wide hotel */}
      <rect x="140" y="100" width="55" height="100" rx="2" fill="#6BB99D"/>
      <rect x="148" y="110" width="12" height="10" rx="1" fill="#9DE4C8" opacity="0.4"/>
      <rect x="165" y="110" width="12" height="10" rx="1" fill="#9DE4C8" opacity="0.4"/>
      <rect x="182" y="110" width="12" height="10" rx="1" fill="#9DE4C8" opacity="0.4"/>
      <rect x="148" y="128" width="12" height="10" rx="1" fill="#9DE4C8" opacity="0.4"/>
      <rect x="165" y="128" width="12" height="10" rx="1" fill="#9DE4C8" opacity="0.4"/>
      <rect x="182" y="128" width="12" height="10" rx="1" fill="#9DE4C8" opacity="0.4"/>
      
      {/* Building 4 - Slanted modern */}
      <polygon points="210,200 210,80 250,70 250,200" fill="#7BC4A8"/>
      <rect x="218" y="90" width="8" height="10" rx="1" fill="#A8E8CC" opacity="0.4"/>
      <rect x="232" y="88" width="8" height="10" rx="1" fill="#A8E8CC" opacity="0.4"/>
      <rect x="218" y="108" width="8" height="10" rx="1" fill="#A8E8CC" opacity="0.4"/>
      <rect x="232" y="106" width="8" height="10" rx="1" fill="#A8E8CC" opacity="0.4"/>
      
      {/* Building 5 - Tower with spire */}
      <rect x="265" y="50" width="30" height="150" rx="2" fill="#8DD4B8"/>
      <rect x="275" y="30" width="10" height="20" rx="1" fill="#8DD4B8"/>
      <rect x="270" y="65" width="7" height="10" rx="1" fill="#B8F5D8" opacity="0.4"/>
      <rect x="283" y="65" width="7" height="10" rx="1" fill="#B8F5D8" opacity="0.4"/>
      <rect x="270" y="82" width="7" height="10" rx="1" fill="#B8F5D8" opacity="0.4"/>
      <rect x="283" y="82" width="7" height="10" rx="1" fill="#B8F5D8" opacity="0.4"/>
      
      {/* Building 6 - Small building */}
      <rect x="310" y="120" width="40" height="80" rx="2" fill="#9DE4C8"/>
      <rect x="318" y="130" width="10" height="8" rx="1" fill="#C8F8E8" opacity="0.4"/>
      <rect x="333" y="130" width="10" height="8" rx="1" fill="#C8F8E8" opacity="0.4"/>
      <rect x="318" y="145" width="10" height="8" rx="1" fill="#C8F8E8" opacity="0.4"/>
      <rect x="333" y="145" width="10" height="8" rx="1" fill="#C8F8E8" opacity="0.4"/>
      
      {/* Trees */}
      <circle cx="25" cy="170" r="12" fill="#3D8B6F"/>
      <circle cx="35" cy="165" r="10" fill="#4A9B7F"/>
      <rect x="28" y="175" width="4" height="25" rx="1" fill="#5A4A3A"/>
      
      <circle cx="360" cy="175" r="14" fill="#3D8B6F"/>
      <circle cx="375" cy="168" r="11" fill="#4A9B7F"/>
      <rect x="365" y="180" width="5" height="20" rx="1" fill="#5A4A3A"/>
      
      {/* People silhouettes */}
      <circle cx="150" cy="185" r="4" fill="#2D6A4F"/>
      <rect x="147" y="189" width="6" height="11" rx="2" fill="#2D6A4F"/>
      
      <circle cx="165" cy="188" r="3" fill="#2D6A4F"/>
      <rect x="163" y="191" width="4" height="9" rx="1" fill="#2D6A4F"/>
      
      <circle cx="320" cy="182" r="4" fill="#2D6A4F"/>
      <rect x="317" y="186" width="6" height="14" rx="2" fill="#2D6A4F"/>
    </svg>
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
      router.push('/subscribe?welcome=1');
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-[#1B4D3E] px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-white">BusyBeds</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Desktop Logo */}
            <Link href="/" className="hidden lg:flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B4D3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9L12 3l9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-800">BusyBeds</span>
            </Link>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
              <p className="text-slate-500">Join BusyBeds and start saving on hotels</p>
            </div>

            {/* Step Indicator */}
            <StepIndicator step={step} />

            {/* STEP 1: Role selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {ROLE_OPTIONS.map(opt => {
                    const selected = form.role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setForm({ ...form, role: opt.value }); setError(''); }}
                        className={`p-5 rounded-xl text-left transition-all border-2 ${
                          selected 
                            ? 'border-emerald-600 bg-emerald-50' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`mb-3 ${selected ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {opt.icon}
                        </div>
                        <div className="font-semibold text-slate-800 text-sm mb-1">{opt.title}</div>
                        <div className="text-xs text-slate-500">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Social Buttons */}
                <div className="space-y-3">
                  <a href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                    <GoogleIcon /> Continue with Google
                  </a>
                </div>

                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

                <button type="button" onClick={nextStep}
                  className="w-full py-3.5 bg-[#1B4D3E] hover:bg-[#2D6A4F] rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Sign In</Link>
                </p>
              </div>
            )}

            {/* STEP 2: Credentials */}
            {step === 2 && (
              <div className="space-y-5">
                {referralApplied && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                    Gift Referral code applied - 7 bonus days incoming!
                  </div>
                )}

                {/* Full name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <UserIcon />
                    </div>
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all"
                      placeholder="John Smith" 
                      value={form.fullName} 
                      onChange={e => setForm({ ...form, fullName: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <MailIcon />
                    </div>
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all"
                      type="email" 
                      placeholder="you@example.com" 
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <PhoneIcon />
                    </div>
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all"
                      type="tel" 
                      placeholder="+1 555 000 0000" 
                      value={form.phone} 
                      onChange={e => setForm({ ...form, phone: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <LockIcon />
                    </div>
                    <input 
                      className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all"
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
                        <div 
                          key={i} 
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            i <= pwStrength.score 
                              ? i === 1 ? 'bg-red-400' 
                                : i === 2 ? 'bg-orange-400' 
                                : i === 3 ? 'bg-yellow-400' 
                                : 'bg-emerald-500'
                              : 'bg-slate-200'
                          }`} 
                        />
                      ))}
                      {pwStrength.label && <span className="text-xs font-medium" style={{ color: pwStrength.color }}>{pwStrength.label}</span>}
                    </div>
                  )}
                </div>

                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                    Back
                  </button>
                  <button type="button" onClick={nextStep}
                    className="flex-1 py-3.5 bg-[#1B4D3E] hover:bg-[#2D6A4F] rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Location + Finalize */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Country + City with Searchable Dropdowns */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Country</label>
                    <SearchableSelect
                      options={COUNTRIES}
                      value={form.country}
                      onChange={val => setForm({ ...form, country: val, city: '' })}
                      placeholder="Select country..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">City</label>
                    {form.country && cities.length > 0 ? (
                      <SearchableSelect
                        options={cities}
                        value={form.city}
                        onChange={val => setForm({ ...form, city: val })}
                        placeholder="Select city..."
                      />
                    ) : (
                      <input
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all disabled:opacity-50"
                        placeholder={form.country ? 'Enter city...' : 'Select country first'}
                        value={form.city}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                        disabled={!form.country}
                      />
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Account Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800">{form.fullName || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800 truncate max-w-40">{form.email || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-medium text-slate-800 capitalize">{form.role === 'hotel_owner' ? 'Hotel Owner' : form.role || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Country</span><span className="font-medium text-slate-800">{form.country || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">City</span><span className="font-medium text-slate-800">{form.city || '-'}</span></div>
                  </div>
                </div>

                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                  <button type="button" onClick={submit} disabled={loading}
                    className="flex-1 py-3.5 bg-[#1B4D3E] hover:bg-[#2D6A4F] rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</> : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Dark Green Panel with Testimonial */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden" style={{ backgroundColor: '#1B4D3E' }}>
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Empty space for balance */}
          <div />

          {/* Testimonial */}
          <div className="max-w-sm">
            {/* Quote marks */}
            <div className="text-amber-500 text-6xl font-serif mb-4">"</div>
            
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              BusyBeds made our Africa trip unforgettable! We found amazing deals on boutique hotels across Kenya and Tanzania. The QR coupon system was so convenient — just scan and save!
            </p>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center text-white font-semibold">
                SO
              </div>
              <div>
                <p className="font-semibold text-white">Sarah Okonkwo</p>
                <p className="text-sm text-white/60">Nairobi</p>
              </div>
            </div>
          </div>

          {/* City Skyline Illustration */}
          <div className="mt-auto pt-8">
            <CitySkylineIllustration />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
