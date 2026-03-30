'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function PromoEmailPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('subscribers');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  const charLimit = 600;

  const handleSend = async () => {
    if (!subject.trim()) { setError('Please enter a subject line.'); return; }
    if (!message.trim() || message.length < 30) { setError('Message must be at least 30 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/owner/promo-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, audience }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send campaign'); return; }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Sent!</h1>
          <p className="text-gray-500 mb-6">Your promotional email has been queued and will be delivered to your target audience shortly.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/owner" className="px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/owner" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Send Promotional Email</h1>
          <p className="text-gray-500 text-sm">Reach BusyBeds subscribers with a message about your hotel. Each send uses one of your monthly email campaign slots.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* Audience */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Audience</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'subscribers', label: 'Active Members', desc: 'Paid subscribers only', icon: '🎫' },
                { value: 'travelers', label: 'All Travelers', desc: 'All registered travelers', icon: '✈️' },
                { value: 'all', label: 'Everyone', desc: 'All verified users', icon: '🌍' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setAudience(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${audience === opt.value ? 'border-teal-500 bg-teal-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className="text-xs font-bold text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={100}
              placeholder={`e.g. "Exclusive 25% off at Grand Palace Hotel this weekend"`}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">{subject.length}/100 characters</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={charLimit}
              rows={6}
              placeholder={`Write your promotional message here. Tell travelers about a special offer, a new room type, a seasonal deal, or what makes your hotel special...`}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all resize-none"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Minimum 30 characters</span>
              <span className={message.length > charLimit - 50 ? 'text-orange-500 font-semibold' : ''}>{message.length}/{charLimit}</span>
            </div>
          </div>

          {/* Preview toggle */}
          <div>
            <button type="button" onClick={() => setPreview(!preview)}
              className="text-sm font-semibold text-teal-600 hover:underline flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/></svg>
              {preview ? 'Hide Preview' : 'Preview Email'}
            </button>
            {preview && subject && message && (
              <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500">Email Preview</div>
                <div className="p-5 bg-white">
                  <p className="text-xs text-gray-400 mb-1">Subject:</p>
                  <p className="font-bold text-gray-900 mb-4">{subject}</p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{message}</p>
                    <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                      <div className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
                        View Hotel Deal →
                      </div>
                      <p className="text-xs text-gray-400 mt-3">Sent via BusyBeds · Unsubscribe</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-2">📝 Tips for better open rates</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Keep subject lines under 50 characters — they show fully on mobile</li>
              <li>• Mention a specific offer (% discount, free breakfast, weekend deal)</li>
              <li>• Include urgency — "This weekend only" or "Limited rooms available"</li>
              <li>• BusyBeds adds your hotel link and unsubscribe automatically</li>
            </ul>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

          <div className="flex gap-3 pt-2">
            <Link href="/owner" className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="button" onClick={handleSend} disabled={loading}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0E7C7B, #1A3C5E)' }}>
              {loading
                ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Sending...</>
                : '📧 Send Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
