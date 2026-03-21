'use client';
import { useState, useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { fullName: string };
}

interface User {
  id: string;
  fullName: string;
}

interface Props {
  hotelId: string;
  avgRating: number | null;
  reviewCount: number;
}

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="text-yellow-400">
      {'★'.repeat(Math.round(rating))}
      {'☆'.repeat(max - Math.round(rating))}
    </span>
  );
}

export default function HotelReviews({ hotelId, avgRating, reviewCount }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch reviews
        const reviewsRes = await fetch(`/api/hotels/${hotelId}/reviews`);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(data.reviews ?? data);
        }

        // Check if user is logged in
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) return;
        const userData = await authRes.json();
        if (!userData?.user) return;
        setUser(userData.user);

        // Only allow review if user has a REDEEMED coupon for this specific hotel
        const couponsRes = await fetch(`/api/coupons?hotelId=${hotelId}&status=redeemed`);
        if (couponsRes.ok) {
          const couponsData = await couponsRes.json();
          const hasRedeemed = Array.isArray(couponsData.coupons)
            ? couponsData.coupons.length > 0
            : false;
          setCanReview(hasRedeemed);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hotelId]);

  const handleSubmitReview = async () => {
    if (!selectedRating) {
      setError('Please select a rating');
      return;
    }

    if (comment.length > 500) {
      setError('Comment must be 500 characters or less');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/hotels/${hotelId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          comment: comment || null,
        }),
      });

      if (res.status === 403) {
        setError('Use a coupon at this hotel to unlock reviews');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to submit review');
      }

      const newReview = await res.json();
      setReviews([newReview, ...reviews]);
      setSelectedRating(0);
      setComment('');
      setShowReviewForm(false);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {avgRating !== null && (
        <div className="card p-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold" style={{ color: '#1A3C5E' }}>
                {avgRating.toFixed(1)}
              </div>
              <div className="text-yellow-400 text-2xl mt-1">
                <StarRow rating={avgRating} />
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </div>
              <p className="text-sm text-gray-500 mt-1">Based on guest experiences</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map(review => {
            const initials = review.user.fullName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();
            const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={review.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-yellow-400">
                    <StarRow rating={review.rating} />
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 mb-3 text-sm">{review.comment}</p>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: '#0E7C7B' }}
                  >
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {review.user.fullName}
                  </span>
                  <span className="text-xs text-gray-400">• {reviewDate}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card p-6 text-center">
            <p className="text-gray-500">No reviews yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* Write a Review */}
      <div className="card p-6">
        {!user ? (
          <div className="text-center py-2">
            <p className="text-gray-600 mb-3">Sign in to leave a review</p>
            <a href="/login" className="btn-primary">Sign In</a>
          </div>
        ) : !canReview ? (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Reviews are for verified guests only</p>
              <p className="text-sm text-amber-700 mt-0.5">You can only review this hotel after redeeming a coupon here.</p>
            </div>
          </div>
        ) : !showReviewForm ? (
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full btn-primary py-2"
          >
            Write a Review
          </button>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold" style={{ color: '#1A3C5E' }}>
              Share your experience
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Star Picker */}
            <div>
              <label className="label block text-sm mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-transform hover:scale-110"
                  >
                    {star <= (hoverRating || selectedRating) ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="label block text-sm mb-2">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, 500))}
                placeholder="Tell other guests about your stay..."
                className="input w-full h-24 text-sm"
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-1">
                {comment.length}/500 characters
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="btn-primary py-2 flex-1 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setSelectedRating(0);
                  setComment('');
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
