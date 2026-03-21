'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface Hotel { id: string; name: string; city: string; country: string; starRating: number; }

export default function ClaimPropertyPage() {
  const [step, setStep]               = useState(1);
  const [hotels, setHotels]           = useState<Hotel[]>([]);
  const [search, setSearch]           = useState('');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [docs, setDocs]               = useState({ govId: false, bizReg: false, agreement: false });
  const [role, setRole]               = useState('');
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/hotels?status=active').then(r => r.json()).then(d => setHotels(d.hotels || []));
  }, []);

  useEffect(() => {
    fetch('/api/apply').then(r => r.json()).then(d => {
      if (d.application) router.replace('/apply/status');
    });
  }, [router]);

  const filtered = hotels.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.city.toLowerCase().includes(search.toLowerCase())
  );

  const submit = async () => {
    if (!selectedHotel) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: selectedHotel.id,
          documents: JSON.stringify(Object.entries(docs).filter(([, v]) => v).map(([k]) => k)),
          notes: [role ? `Role: ${role}` : '', notes].filter(Boolean).join('\n'),
        }),
      });
      if (res.status === 401) { router.push('/login?next=/apply'); return; }
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed'); return; }
      router.push('/apply/status');
    } finally { setLoading(false); }
  };

  const docList = [
    { key: 'govId',     label: 'Government-issued ID',  desc: "Passport, national ID, or driver's license" },
    { key: 'bizReg',    label: 'Business Registration', desc: 'Certificate of incorporation or trade license' },
    { key: 'agreement', label: 'Management Agreement',  desc: 'Letter of authority, lease, or management contract' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center mb-6"><Logo height={36} /></Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Property Representatives Only
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Claim Your Property</h1>
          <p className="text-gray-500 mt-1 text-sm max-w-sm mx-auto">Request manager access for a hotel already listed on BusyBeds</p>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth={2} strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">How this works: </span>
            Hotels on BusyBeds are owned by the platform. You can request <strong>manager access</strong> for a property you represent. Once approved, you can update hotel info and manage coupon redemptions.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Select Property','Verify Identity','Submit Request'].map((label, i) => {
            const n = i + 1;
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${step >= n ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                  style={step >= n ? { background: '#E8395A' } : {}}>
                  {step > n ? '✓' : n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= n ? 'text-rose-600' : 'text-gray-400'}`}>{label}</span>
                {n < 3 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-rose-400' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-1">Which property do you represent?</h2>
            <p className="text-sm text-gray-500 mb-5">Search for your hotel in our directory. If not listed, ask admin to add it first.</p>
            <input
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors mb-4"
              placeholder="Search by hotel name or city…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <p className="text-sm">No properties found.</p>
                  <p className="text-xs mt-1">Contact admin to have your hotel added to the platform.</p>
                </div>
              )}
              {filtered.map(h => (
                <button key={h.id} onClick={() => setSelectedHotel(h)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedHotel?.id === h.id ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-rose-300 hover:bg-gray-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{h.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">📍 {h.city}, {h.country}</div>
                    </div>
                    <span className="text-yellow-400 text-sm flex-shrink-0">{'★'.repeat(h.starRating)}</span>
                  </div>
                  {selectedHotel?.id === h.id && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!selectedHotel}
              className="w-full mt-5 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: '#E8395A' }}>
              Continue →
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Hotel not listed?{' '}
              <Link href="/?suggest=1" className="hover:underline" style={{ color: '#E8395A' }}>Suggest it to admin</Link>
            </p>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-1">Verify your identity</h2>
            <p className="text-sm text-gray-500 mb-5">Tell us your role and which documents you can provide. Our team collects them securely.</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-rose-50">🏨</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm truncate">{selectedHotel?.name}</div>
                <div className="text-xs text-gray-500">{selectedHotel?.city}, {selectedHotel?.country}</div>
              </div>
              <button onClick={() => setStep(1)} className="text-xs font-medium hover:underline flex-shrink-0" style={{ color: '#E8395A' }}>Change</button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your role at this property</label>
              <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
                placeholder="e.g. General Manager, Owner, Operations Director…"
                value={role} onChange={e => setRole(e.target.value)} />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Documents you can provide</label>
              <div className="space-y-2">
                {docList.map(({ key, label, desc }) => (
                  <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${docs[key as keyof typeof docs] ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-rose-200'}`}>
                    <input type="checkbox" checked={docs[key as keyof typeof docs]}
                      onChange={e => setDocs({ ...docs, [key]: e.target.checked })}
                      className="mt-0.5 w-4 h-4" style={{ accentColor: '#E8395A' }} />
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Additional notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors resize-none"
                rows={3} placeholder="Anything else you'd like our team to know…"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:border-gray-800 transition-colors">← Back</button>
              <button onClick={() => setStep(3)} disabled={!Object.values(docs).some(Boolean)}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                style={{ background: '#E8395A' }}>
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-5">Review your request</h2>
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5">Property</p>
                <p className="font-semibold text-gray-800">{selectedHotel?.name}</p>
                <p className="text-sm text-gray-500">{selectedHotel?.city}, {selectedHotel?.country}</p>
              </div>
              {role && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5">Your role</p>
                  <p className="text-sm text-gray-800">{role}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Documents to provide</p>
                {docList.filter(d => docs[d.key as keyof typeof docs]).map(d => (
                  <div key={d.key} className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8395A" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {d.label}
                  </div>
                ))}
              </div>
              {notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5">Notes</p>
                  <p className="text-sm text-gray-700">{notes}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl p-4 mb-5 bg-rose-50 border border-rose-100">
              <p className="font-semibold text-sm mb-1" style={{ color: '#E8395A' }}>What happens next?</p>
              <p className="text-xs text-gray-600 leading-relaxed">Our team reviews within 1–2 business days, contacts you to verify documents, then grants manager access to update your hotel profile and track coupon redemptions.</p>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl mb-3 border border-red-100">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:border-gray-800 transition-colors">← Back</button>
              <button onClick={submit} disabled={loading}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: '#E8395A' }}>
                {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Submitting…</> : '🏨 Submit Claim Request'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:underline">← Back to BusyBeds</Link>
          {' · '}
          <Link href="/login" className="hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
