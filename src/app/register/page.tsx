'use client';
import { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { COUNTRIES, getCities } from '@/lib/locations';
import Logo from '@/components/Logo';

// ─── Hotel slides (different set from login) ─────────────────────────────────
const HOTEL_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1400&q=85',
    headline: 'JOIN\nTHOUSANDS OF\nTRAVELERS',
    sub: 'Create your free account and start unlocking exclusive hotel deals across East Africa.',
    tagline: 'Your adventure begins now.',
  },
  {
    url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&q=85',
    headline: 'HOTELS.\nBEACHES.\nSAFARIS.',
    sub: 'BusyBeds connects you to the best stays — from city hotels to wild safari lodges.',
    tagline: 'One subscription. Endless escapes.',
  },
  {
    url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1400&q=85',
    headline: 'LIST YOUR\nHOTEL &\nGROW',
    sub: 'Are you a hotel owner? Partner with BusyBeds and reach thousands of travelers.',
    tagline: 'Apply in minutes. Go live in 48h.',
  },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function CheckMini() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Claimable hotel type ────────────────────────────────────────────────────
type ClaimableHotel = {
  id: string; name: string; city: string; country: string;
  starRating: number; category: string; coverImage: string | null;
};

// ─── Password strength ───────────────────────────────────────────────────────
function pwStrength(pw: string) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Weak', color: '#EF4444' },
    { score: 2, label: 'Fair', color: '#F97316' },
    { score: 3, label: 'Good', color: '#EAB308' },
    { score: 4, label: 'Strong', color: '#22C55E' },
  ][s];
}

// ─── Searchable Select ───────────────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder }: {
  options: string[]; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-left focus:outline-none focus:border-slate-400 transition-all flex items-center justify-between">
        <span className={value ? 'text-slate-800' : 'text-slate-300'}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input type="text" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm focus:outline-none"
              onClick={e => e.stopPropagation()} />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-4 py-3 text-sm text-slate-400 text-center">No results</div>
              : filtered.map(o => (
                <button key={o} type="button"
                  onClick={() => { onChange(o); setOpen(false); setQ(''); }}
                  className={`w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${value === o ? 'font-semibold text-slate-900 bg-slate-50' : 'text-slate-700'}`}>
                  {o}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ step, isOwner }: { step: number; isOwner: boolean }) {
  const labels = isOwner ? ['Role', 'Details', 'Location', 'Claim Hotel'] : ['Role', 'Details', 'Location'];
  const total = labels.length;
  return (
    <div className="flex items-center gap-1 mb-6 flex-wrap">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              done ? 'text-white' : active ? 'border-2 border-slate-900 text-slate-900 bg-white' : 'bg-slate-100 text-slate-400'
            }`} style={done ? { background: 'linear-gradient(135deg, #0d3b2e, #1B4D3E)' } : {}}>
              {done
                ? <span className="w-3 h-3 flex items-center justify-center"><CheckMini /></span>
                : <span>{n}</span>}
              <span>{label}</span>
            </div>
            {n < total && <div className={`w-3 h-px ${done ? 'bg-slate-400' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Image Panel ─────────────────────────────────────────────────────────────
function ImagePanel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => { setCurrent(p => (p + 1) % HOTEL_SLIDES.length); setFading(false); }, 500);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const slide = HOTEL_SLIDES[current];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${slide.url})`,
          opacity: fading ? 0 : 1,
          transform: fading ? 'scale(1.03)' : 'scale(1)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/80" />

      {/* Logo */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Logo variant="light" height={36} />
        </Link>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <h2 className="text-white font-black leading-none mb-4 drop-shadow-lg"
          style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', whiteSpace: 'pre-line', opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease 0.15s' }}>
          {slide.headline}
        </h2>
        <p className="text-white/75 text-sm leading-relaxed mb-1"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease 0.2s' }}>{slide.sub}</p>
        <p className="text-white/50 text-xs mb-6"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease 0.25s' }}>{slide.tagline}</p>
        <div className="flex items-center gap-2">
          {HOTEL_SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 400); }}
              aria-label={`Slide ${i + 1}`}
              style={{ width: i === current ? '24px' : '7px', height: '7px', borderRadius: '99px', background: i === current ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: '', country: '', city: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hotel claim state (step 4 for hotel_owner)
  const [hotelSearch, setHotelSearch] = useState('');
  const [hotelResults, setHotelResults] = useState<ClaimableHotel[]>([]);
  const [hotelSearching, setHotelSearching] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<ClaimableHotel | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const cities = getCities(form.country);
  const strength = pwStrength(form.password);
  const isOwner = form.role === 'hotel_owner';
  const totalSteps = isOwner ? 4 : 3;

  // Debounced hotel search
  const searchHotels = (q: string) => {
    setHotelSearch(q);
    setSelectedHotel(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setHotelResults([]); return; }
    setHotelSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hotels/claimable?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setHotelResults(data.hotels || []);
      } catch { setHotelResults([]); }
      finally { setHotelSearching(false); }
    }, 400);
  };

  const nextStep = () => {
    if (step === 1 && !form.role) { setError('Please choose your role to continue.'); return; }
    if (step === 2) {
      if (!form.fullName.trim()) { setError('Full name is required.'); return; }
      if (!form.email.trim()) { setError('Email is required.'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }
    setError(''); setStep(step + 1);
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          hotelId: selectedHotel?.id || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Registration failed'); return; }
      if (refCode) {
        try {
          await fetch('/api/referral/use', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: refCode }) });
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

  const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{ background: 'linear-gradient(135deg, #0a0f0e 0%, #0d1f1a 40%, #091818 100%)' }}>

      {/* BG blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #1B4D3E, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #0E7C7B, transparent)' }} />
      </div>

      {/* Floating card */}
      <div className="relative z-10 w-full flex overflow-hidden"
        style={{ maxWidth: '960px', minHeight: '600px', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', background: '#fff' }}>

        {/* LEFT — image */}
        <div className="hidden lg:block w-[46%] shrink-0 p-3">
          <ImagePanel />
        </div>

        {/* RIGHT — form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 sm:px-12 overflow-y-auto">

          {/* Mobile logo */}
          <div className="lg:hidden mb-6">
            <Link href="/">
              <Logo variant="dark" height={32} />
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">CREATE ACCOUNT !</h1>
            <p className="text-slate-400 text-sm">Join BusyBeds and start saving on hotels.</p>
          </div>

          {/* Step indicator */}
          <Steps step={step} isOwner={isOwner} />

          {/* ── STEP 1: Role ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'traveler', emoji: '🧳', title: 'Traveler', desc: 'I want hotel discounts' },
                  { value: 'hotel_owner', emoji: '🏨', title: 'Hotel Owner', desc: 'I want to list my hotel' },
                ].map(opt => {
                  const sel = form.role === opt.value;
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => { setForm({ ...form, role: opt.value }); setError(''); }}
                      className={`p-4 rounded-xl text-left transition-all border-2 ${sel ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="text-2xl mb-2">{opt.emoji}</div>
                      <div className="font-bold text-slate-800 text-sm mb-0.5">{opt.title}</div>
                      <div className="text-xs text-slate-400">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Hotel owner info */}
              {form.role === 'hotel_owner' && (
                <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-base shrink-0">💡</span>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    After registering you'll be taken to the <strong>Hotel Application form</strong>. Our team reviews and publishes your listing within 24–48 hours.
                  </p>
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <button type="button" onClick={nextStep}
                className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0d3b2e, #1B4D3E)' }}>
                Continue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-300 font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <a href="/api/auth/google"
                className="w-full py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                <GoogleIcon />Sign up with Google
              </a>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-slate-800 hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input className={inputClass} placeholder="John Smith" value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
                <input className={inputClass} type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Phone <span className="text-slate-300 normal-case">(optional)</span>
                </label>
                <input className={inputClass} type="tel" placeholder="+254 700 000 000" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input className={`${inputClass} pr-11`} type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <EyeIcon open={showPass} />
                  </button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: i <= strength.score ? (i===1?'#EF4444':i===2?'#F97316':i===3?'#EAB308':'#22C55E') : '#e2e8f0' }} />
                    ))}
                    {strength.label && <span className="text-xs font-medium ml-1" style={{ color: strength.color }}>{strength.label}</span>}
                  </div>
                )}
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button type="button" onClick={nextStep}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0d3b2e, #1B4D3E)' }}>
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Location ── */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Country</label>
                <SearchableSelect options={COUNTRIES} value={form.country}
                  onChange={v => setForm({ ...form, country: v, city: '' })} placeholder="Select country..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">City</label>
                {form.country && cities.length > 0 ? (
                  <SearchableSelect options={cities} value={form.city}
                    onChange={v => setForm({ ...form, city: v })} placeholder="Select city..." />
                ) : (
                  <input className={`${inputClass} ${!form.country ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder={form.country ? 'Enter your city...' : 'Select a country first'}
                    value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    disabled={!form.country} />
                )}
              </div>

              {/* Summary */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Summary</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Name', form.fullName || '—'],
                    ['Email', form.email || '—'],
                    ['Role', form.role === 'hotel_owner' ? 'Hotel Owner' : form.role ? 'Traveler' : '—'],
                    ['Country', form.country || '—'],
                    ['City', form.city || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[180px] text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  Back
                </button>
                {isOwner ? (
                  /* Hotel owners go to step 4 to claim their hotel */
                  <button type="button" onClick={nextStep}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #0d3b2e, #1B4D3E)' }}>
                    Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ) : (
                  /* Travellers submit here */
                  <button type="button" onClick={submit} disabled={loading}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #0d3b2e, #1B4D3E)' }}>
                    {loading
                      ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Creating...</>
                      : 'Create Account'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: Claim Your Hotel (hotel owners only) ── */}
          {step === 4 && isOwner && (
            <div className="space-y-4">

              {/* Instruction */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Find Your Hotel</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Search for your hotel by name or city. Select it to claim ownership — our team will verify and approve your claim within 24–48 hours.
                </p>
              </div>

              {/* Search input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Search Hotel Name or City</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Grand Palace Hotel, Nairobi..."
                    value={hotelSearch}
                    onChange={e => searchHotels(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {hotelSearching
                      ? <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full" />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    }
                  </div>
                </div>
              </div>

              {/* Search results */}
              {hotelResults.length > 0 && !selectedHotel && (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {hotelResults.map(hotel => (
                    <button key={hotel.id} type="button" onClick={() => { setSelectedHotel(hotel); setHotelResults([]); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                        {hotel.coverImage
                          ? <img src={hotel.coverImage} alt={hotel.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg">🏨</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{hotel.name}</p>
                        <p className="text-xs text-slate-400">{hotel.city}, {hotel.country} · {'⭐'.repeat(Math.min(hotel.starRating, 5))}</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-300 shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {hotelSearch.length >= 2 && !hotelSearching && hotelResults.length === 0 && !selectedHotel && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 mb-2">No unclaimed hotels found for &quot;{hotelSearch}&quot;</p>
                  <Link href="/apply" className="text-sm font-semibold text-slate-700 underline underline-offset-2">
                    Apply to add your hotel instead →
                  </Link>
                </div>
              )}

              {/* Selected hotel card */}
              {selectedHotel && (
                <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                    {selectedHotel.coverImage
                      ? <img src={selectedHotel.coverImage} alt={selectedHotel.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{selectedHotel.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">{selectedHotel.city}, {selectedHotel.country}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedHotel(null); setHotelSearch(''); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}

              {/* Skip option */}
              <p className="text-xs text-slate-400 text-center">
                Don&apos;t see your hotel?{' '}
                <button type="button" onClick={() => { setSelectedHotel(null); submit(); }}
                  className="text-slate-600 font-semibold underline underline-offset-2 hover:text-slate-800">
                  Skip & register anyway
                </button>
                {' '}— you can claim it later from your dashboard.
              </p>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setStep(3)}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button type="button" onClick={submit} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0d3b2e, #1B4D3E)' }}>
                  {loading
                    ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Creating...</>
                    : selectedHotel ? '📋 Submit Claim & Register' : 'Register Without Claiming'}
                </button>
              </div>
            </div>
          )}

          {step > 1 && (
            <p className="mt-5 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-slate-800 hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f0e' }}>
        <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
