'use client';
import { useState } from 'react';

interface Props {
  trigger?: React.ReactNode;
}

export default function SuggestHotelModal({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    hotelName: '',
    hotelCity: '',
    hotelCountry: '',
    hotelWebsite: '',
    notes: '',
    email: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.[0]?.message || 'Something went wrong');
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setDone(false);
    setError('');
    setForm({ hotelName: '', hotelCity: '', hotelCountry: '', hotelWebsite: '', notes: '', email: '' });
  }

  return (
    <>
      {/* Trigger */}
      <span onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        {trigger ?? (
          <button className="btn-outline text-sm py-2 px-5">
            💡 Suggest a Hotel
          </button>
        )}
      </span>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Suggest a Hotel</h2>
                <p className="text-xs text-gray-500 mt-0.5">Know a great hotel? We'll reach out to add it.</p>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">✕</button>
            </div>

            {done ? (
              /* Success state */
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Thanks for the tip!</h3>
                <p className="text-sm text-gray-500 mb-6">We'll review your suggestion and contact the hotel soon.</p>
                <button onClick={close} className="btn-primary w-full">Close</button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={submit} className="px-6 py-5 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label className="label">Hotel Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. The Grand Riviera"
                    value={form.hotelName}
                    onChange={set('hotelName')}
                    required
                    minLength={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">City *</label>
                    <input
                      className="input"
                      placeholder="e.g. Dubai"
                      value={form.hotelCity}
                      onChange={set('hotelCity')}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Country *</label>
                    <input
                      className="input"
                      placeholder="e.g. UAE"
                      value={form.hotelCountry}
                      onChange={set('hotelCountry')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Hotel Website</label>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://..."
                    value={form.hotelWebsite}
                    onChange={set('hotelWebsite')}
                  />
                </div>

                <div>
                  <label className="label">Your Email (for updates)</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>

                <div>
                  <label className="label">Additional Notes</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Anything we should know about this hotel..."
                    value={form.notes}
                    onChange={set('notes')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
