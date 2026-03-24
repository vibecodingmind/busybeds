'use client';
import { useState } from 'react';
import StarRating from './StarRating';

interface Props {
  hotelId: string;
  hotelName: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ hotelId, hotelName, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, rating, title, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        onSubmitted?.();
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  if (success) return (
    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
      <div className="text-3xl mb-2">🎉</div>
      <p className="font-semibold text-green-700 dark:text-green-300">Review submitted!</p>
      <p className="text-sm text-green-600 dark:text-green-400 mt-1">It will appear after our team reviews it (usually within 24 hours).</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-gray-900 dark:text-white text-lg">Write a Review</h3>

      {/* Star picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <span className="text-sm text-gray-500">
              {['', 'Terrible', 'Poor', 'OK', 'Good', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required maxLength={100}
          placeholder="Summarise your stay in a sentence"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF385C]" />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Review</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} required rows={4} maxLength={1000}
          placeholder="Tell future guests about your experience — what did you love? What could be better?"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none" />
        <p className="text-xs text-gray-400 text-right mt-1">{body.length}/1000</p>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-3 bg-[#FF385C] hover:bg-[#e0334f] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 text-sm">
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
