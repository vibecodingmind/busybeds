'use client';

import { useState, useEffect } from 'react';

interface Props {
  photos: { url: string; id: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex = 0, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const delta = touchStart - touchEnd;

    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        // Swiped left - go to next
        setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
      } else {
        // Swiped right - go to prev
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
      }
    }
    setTouchStart(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close lightbox"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Photo index indicator */}
      <div className="absolute top-6 left-6 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Main image */}
      <div
        className="relative w-full h-full flex items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[currentIndex].url}
          alt={`Photo ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-[90vw] object-contain transition-opacity duration-300"
        />
      </div>

      {/* Prev button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
        }}
        className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 rounded-full hover:bg-black/30"
        aria-label="Previous photo"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
        }}
        className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 rounded-full hover:bg-black/30"
        aria-label="Next photo"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Thumbnail strip at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-3 rounded-xl max-w-[90vw] overflow-x-auto">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              idx === currentIndex ? 'border-teal-400' : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            <img
              src={photo.url}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
