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

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>
          Pending Hotel Suggestions
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
        <div className="space-y-3">
          {suggestions.map(s => (
            <div key={s.id} className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-800">{s.hotelName}</div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {s.city}, {s.country}
                  </div>
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
      )}
    </div>
  );
}
