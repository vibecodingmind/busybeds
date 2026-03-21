'use client';
import { useEffect, useRef } from 'react';

interface Props {
  onIntersect: () => void;
  loading: boolean;
  hasMore: boolean;
}

export default function InfiniteScrollTrigger({ onIntersect, loading, hasMore }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && !loading && hasMore) onIntersect(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, loading, hasMore]);

  if (!hasMore && !loading) return null;

  return (
    <div ref={ref} className="flex items-center justify-center py-8">
      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="w-5 h-5 border-2 border-[#E8395A] border-t-transparent rounded-full animate-spin" />
          Loading more hotels…
        </div>
      )}
    </div>
  );
}
