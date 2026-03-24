'use client';
import { useState, useEffect, useCallback } from 'react';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

interface Review {
  id: string; rating: number; title: string; body: string;
  isVerified: boolean; ownerReply?: string | null; repliedAt?: string | null;
  createdAt: string; user: { fullName: string; id: string };
}
interface Props {
  hotelId: string;
  hotelName: string;
  isOwner?: boolean;
  avgRating?: number | null;
  reviewCount?: number;
}

export default function ReviewsSection({ hotelId, hotelName, isOwner, avgRating, reviewCount = 0 }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(reviewCount);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?hotelId=${hotelId}&page=${p}`);
      const data = await res.json();
      setReviews(p === 1 ? data.reviews || [] : prev => [...prev, ...(data.reviews || [])]);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setRatingBreakdown(data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    } catch {}
    setLoading(false);
  }, [hotelId]);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  const handleReply = (id: string, reply: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, ownerReply: reply } : r));
  };

  const displayRating = avgRating ?? (total > 0 ? Object.entries(ratingBreakdown).reduce((sum, [r, c]) => sum + Number(r) * c, 0) / total : 0);

  return (
    <section className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {total > 0 ? `${total} Review${total !== 1 ? 's' : ''}` : 'Reviews'}
      </h2>

      {total > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
          {/* Average */}
          <div className="flex flex-col items-center justify-center sm:border-r sm:border-gray-200 sm:dark:border-gray-700 sm:pr-6">
            <p className="text-5xl font-bold text-gray-900 dark:text-white">{displayRating > 0 ? displayRating.toFixed(1) : '—'}</p>
            <StarRating value={Math.round(displayRating)} readonly size="md" />
            <p className="text-sm text-gray-500 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
          </div>
          {/* Breakdown */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingBreakdown[star] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 w-6 text-right">{star}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF385C] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review button */}
      {!isOwner && (
        <div className="mb-6">
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="px-6 py-3 border-2 border-[#FF385C] text-[#FF385C] font-semibold rounded-xl hover:bg-pink-50 dark:hover:bg-pink-950 transition-colors text-sm">
              ✍️ Write a Review
            </button>
          ) : (
            <ReviewForm hotelId={hotelId} hotelName={hotelName} onSubmitted={() => setShowForm(false)} />
          )}
        </div>
      )}

      {/* Reviews list */}
      {loading && reviews.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">⭐</div>
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} isOwner={isOwner} onReply={handleReply} />
          ))}
          {page < pages && (
            <button onClick={() => { const next = page + 1; setPage(next); fetchReviews(next); }}
              disabled={loading}
              className="w-full py-3 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50">
              {loading ? 'Loading…' : `Load more reviews (${total - reviews.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
