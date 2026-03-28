'use client';
import { useState, useEffect } from 'react';

interface Suggestion {
  id: string;
  hotelName: string;
  city: string;
  country: string;
  website?: string;
  notes?: string;
  submittedBy?: string;
  email?: string;
  createdAt: string;
}

function isPartnerApplication(notes?: string) {
  return notes?.startsWith('[PARTNER APPLICATION]') ?? false;
}

function parsePartnerNotes(notes: string): Record<string, string> {
  const result: Record<string, string> = {};
  notes.split('\n').forEach(line => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) result[match[1].trim()] = match[2].trim();
  });
  return result;
}

export default function SuggestionReview() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/suggestions');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (suggestionId: string, action: 'accept' | 'reject') => {
    setActing(suggestionId);
    try {
      const res = await fetch('/api/admin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, action }),
      });

      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }
    } catch (error) {
      console.error(`Error ${action}ing suggestion:`, error);
    } finally {
      setActing(null);
    }
  };

  const partnerApps = suggestions.filter(s => isPartnerApplication(s.notes));
  const regularSuggestions = suggestions.filter(s => !isPartnerApplication(s.notes));

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>
          Partner Applications &amp; Hotel Suggestions
        </h2>
        {suggestions.length > 0 && (
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
            {suggestions.length} pending
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm">No pending suggestions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Partner Applications */}
          {partnerApps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">🤝 Partner Applications</span>
                <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{partnerApps.length}</span>
              </div>
              <div className="space-y-3">
                {partnerApps.map(s => {
                  const info = parsePartnerNotes(s.notes || '');
                  return (
                    <div key={s.id} className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{s.hotelName}</div>
                          <div className="text-sm text-gray-600">{s.city}, {s.country}</div>
                          {s.website && (
                            <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">{s.website}</a>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 text-right">
                          <div>{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          {info['Ref'] && <div className="font-mono text-teal-600 font-bold">{info['Ref']}</div>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs">
                        {info['Contact'] && <div className="bg-white rounded-lg px-3 py-2 border border-teal-100 col-span-2">
                          <span className="text-gray-400">Contact:</span>{' '}
                          <span className="font-semibold text-gray-800">{info['Contact']}</span>
                        </div>}
                        {info['Phone'] && <div className="bg-white rounded-lg px-3 py-2 border border-teal-100">
                          <span className="text-gray-400">Phone:</span>{' '}
                          <span className="font-semibold">{info['Phone']}</span>
                        </div>}
                        {info['WhatsApp'] && <div className="bg-white rounded-lg px-3 py-2 border border-teal-100">
                          <span className="text-gray-400">WhatsApp:</span>{' '}
                          <span className="font-semibold">{info['WhatsApp']}</span>
                        </div>}
                        {info['Hotel Type'] && <div className="bg-white rounded-lg px-3 py-2 border border-teal-100">
                          <span className="text-gray-400">Type:</span>{' '}
                          <span className="font-semibold">{info['Hotel Type']}</span>
                        </div>}
                        {info['Discount Offered'] && <div className="bg-white rounded-lg px-3 py-2 border border-teal-100">
                          <span className="text-gray-400">Discount:</span>{' '}
                          <span className="font-bold text-red-500">{info['Discount Offered']}</span>
                        </div>}
                      </div>

                      {info['Notes'] && (
                        <div className="bg-white rounded-lg p-3 mb-3 text-sm text-gray-700 border border-teal-100">
                          <strong className="text-gray-800">Notes:</strong> {info['Notes']}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(s.id, 'accept')}
                          disabled={acting === s.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {acting === s.id ? '...' : '✅ Approve & Create Hotel'}
                        </button>
                        <button
                          onClick={() => handleAction(s.id, 'reject')}
                          disabled={acting === s.id}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {acting === s.id ? '...' : '❌ Decline'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Suggestions */}
          {regularSuggestions.length > 0 && (
            <div>
              {partnerApps.length > 0 && (
                <div className="flex items-center gap-2 mb-3 mt-4">
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">💡 Hotel Suggestions</span>
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{regularSuggestions.length}</span>
                </div>
              )}
              <div className="space-y-3">
                {regularSuggestions.map(s => (
                  <div key={s.id} className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-800">{s.hotelName}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{s.city}, {s.country}</div>
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline mt-1 inline-block">
                            {s.website}
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    {s.notes && (
                      <div className="bg-white rounded-lg p-3 mb-3 text-sm text-gray-700 border border-orange-100">
                        <strong className="text-gray-800">Notes:</strong> {s.notes}
                      </div>
                    )}

                    <div className="text-xs text-gray-600 mb-3">
                      Submitted by: <strong>{s.submittedBy || 'Anonymous'}</strong>
                      {s.email && <span className="text-gray-400"> ({s.email})</span>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(s.id, 'accept')}
                        disabled={acting === s.id}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {acting === s.id ? '...' : '✅ Accept'}
                      </button>
                      <button
                        onClick={() => handleAction(s.id, 'reject')}
                        disabled={acting === s.id}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {acting === s.id ? '...' : '❌ Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
