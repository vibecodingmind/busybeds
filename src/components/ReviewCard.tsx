'use client';
import { useState } from 'react';
import StarRating from './StarRating';

interface Review {
  id: string; rating: number; title: string; body: string;
  isVerified: boolean; ownerReply?: string | null; repliedAt?: string | null;
  createdAt: string; user: { fullName: string; id: string };
}

interface Props {
  review: Review;
  isOwner?: boolean;
  onReply?: (id: string, reply: string) => void;
}

export default function ReviewCard({ review, isOwner, onReply }: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const initials = review.user.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      if (res.ok) {
        onReply?.(review.id, replyText);
        setShowReplyForm(false);
        setReplyText('');
      }
    } catch {}
    setSending(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF385C] to-[#BD1E59] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{review.user.fullName}</span>
            {review.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                Verified stay
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{review.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.body}</p>

      {/* Owner reply */}
      {review.ownerReply && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-750 rounded-xl p-4 border-l-2 border-[#FF385C]">
          <p className="text-xs font-semibold text-gray-500 mb-1">🏨 Hotel Response</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{review.ownerReply}</p>
        </div>
      )}

      {/* Reply form for owner */}
      {isOwner && !review.ownerReply && (
        <div className="mt-3">
          {!showReplyForm ? (
            <button onClick={() => setShowReplyForm(true)}
              className="text-sm text-[#FF385C] hover:underline font-medium">
              Reply to this review →
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                placeholder="Write your response as the hotel…"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none" />
              <div className="flex gap-2">
                <button onClick={submitReply} disabled={sending}
                  className="px-4 py-1.5 bg-[#FF385C] text-white text-sm font-semibold rounded-xl hover:bg-[#e0334f] transition-colors disabled:opacity-50">
                  {sending ? 'Posting…' : 'Post Reply'}
                </button>
                <button onClick={() => setShowReplyForm(false)}
                  className="px-4 py-1.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
