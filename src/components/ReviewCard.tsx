'use client';
import { useState } from 'react';
import StarRating from './StarRating';

interface Review {
  id: string; rating: number; title: string; body: string;
  isVerified: boolean; ownerReply?: string | null; repliedAt?: string | null;
  createdAt: string;
  // Either a logged-in user or a Google review author
  user?: { fullName: string; id: string; avatar?: string | null };
  // Google review fields
  source?: string;
  authorName?: string;
  authorPhotoUrl?: string | null;
  reviewedAt?: string | null;
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

  // Determine if this is a Google review
  const isGoogleReview = review.source === 'google';
  
  // Get author name
  const authorName = review.authorName || review.user?.fullName || 'Anonymous';
  
  // Get author photo (for Google reviews)
  const authorPhoto = review.authorPhotoUrl || review.user?.avatar || null;
  
  // Get initials for avatar fallback
  const initials = authorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  
  // Get review date
  const reviewDate = review.reviewedAt 
    ? new Date(review.reviewedAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })
    : new Date(review.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' });

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
        {authorPhoto ? (
          <img 
            src={authorPhoto} 
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isGoogleReview ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-[#FF385C] to-[#BD1E59]'}`}>
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{authorName}</span>
            {isGoogleReview && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                via Google
              </span>
            )}
            {review.isVerified && !isGoogleReview && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                Verified stay
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-xs text-gray-400">{reviewDate}</span>
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
