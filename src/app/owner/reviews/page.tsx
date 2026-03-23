'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Review {
  id: string; rating: number; title: string; body: string;
  ownerReply: string | null; repliedAt: string | null; createdAt: string;
  user: { fullName: string };
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= n ? '#FF385C' : '#E5E7EB'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetch('/api/owner/reviews').then(r => r.json());
    setReviews(data.reviews || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startReply = (r: Review) => {
    setReplyingId(r.id);
    setReplyText(r.ownerReply || '');
  };

  const saveReply = async (id: string) => {
    setSaving(true);
    await fetch(`/api/owner/reviews?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: replyText }),
    });
    setSaving(false);
    setReplyingId(null);
    load();
  };

  const deleteReply = async (id: string) => {
    if (!confirm('Remove your reply?')) return;
    await fetch(`/api/owner/reviews?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: '' }),
    });
    load();
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/owner" className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Guest Reviews</h1>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">No approved reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Stars n={r.rating} />
                      <span className="font-semibold text-sm text-gray-900">{r.title}</span>
                    </div>
                    <p className="text-xs text-gray-400">{r.user.fullName} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!r.ownerReply && replyingId !== r.id && (
                    <button onClick={() => startReply(r)}
                      className="text-xs text-[#0E7C7B] border border-[#0E7C7B] px-3 py-1 rounded-lg hover:bg-[#0E7C7B]/5 transition-colors flex-shrink-0">
                      Reply
                    </button>
                  )}
                  {r.ownerReply && replyingId !== r.id && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startReply(r)} className="text-xs text-gray-500 hover:underline">Edit</button>
                      <button onClick={() => deleteReply(r.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-3">{r.body}</p>

                {r.ownerReply && replyingId !== r.id && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Your Reply</p>
                    <p className="text-sm text-blue-800">{r.ownerReply}</p>
                  </div>
                )}

                {replyingId === r.id && (
                  <div className="mt-3 space-y-2">
                    <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder="Write your reply to this guest…"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => saveReply(r.id)} disabled={saving || !replyText.trim()}
                        className="bg-[#0E7C7B] hover:bg-[#0a6160] disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                        {saving ? 'Saving…' : 'Post Reply'}
                      </button>
                      <button onClick={() => setReplyingId(null)}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
