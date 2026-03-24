'use client';
import { useState, useEffect } from 'react';
import StarRating from '@/components/StarRating';
import Link from 'next/link';

interface Review {
  id: string; rating: number; title: string; body: string;
  isVerified: boolean; isApproved: boolean; createdAt: string;
  user: { fullName: string; email: string };
  hotel: { name: string; slug: string };
}

export default function ReviewsModerationClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [acting, setActing] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [filter]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) setReviews(prev => prev.filter(r => r.id !== id));
    } catch {}
    setActing(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending', 'approved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {filter === f && `(${reviews.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p>No {filter} reviews</p>
        </div>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StarRating value={review.rating} readonly size="sm" />
                  {review.isVerified && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">✓ Verified</span>}
                  <Link href={`/hotels/${review.hotel.slug}`} target="_blank" className="text-xs text-[#FF385C] hover:underline">{review.hotel.name}</Link>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{review.body}</p>
                <p className="text-xs text-gray-400 mt-2">By {review.user.fullName} ({review.user.email}) · {new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              {filter === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => act(review.id, 'approve')} disabled={acting === review.id}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {acting === review.id ? '…' : '✓ Approve'}
                  </button>
                  <button onClick={() => act(review.id, 'reject')} disabled={acting === review.id}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {acting === review.id ? '…' : '✗ Reject'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
