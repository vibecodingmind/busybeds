'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  hotelId: string;
  initialFavorited?: boolean;
  size?: 'sm' | 'md';
}

export default function FavoriteButton({ hotelId, initialFavorited = false, size = 'md' }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push('/login?next=' + window.location.pathname);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId }),
      });

      if (res.status === 401) {
        router.push('/login?next=' + window.location.pathname);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'text-lg px-2 py-2' 
    : 'text-2xl px-3 py-3';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses} rounded-full transition-all active:scale-90 disabled:opacity-60`}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {favorited ? '❤️' : '🤍'}
    </button>
  );
}
