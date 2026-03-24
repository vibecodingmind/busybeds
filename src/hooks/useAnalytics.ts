import { useCallback } from 'react';

export function useAnalytics() {
  const track = useCallback(
    async (eventType: string, hotelId?: string, couponId?: string, metadata?: any) => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType,
            hotelId: hotelId || null,
            couponId: couponId || null,
            metadata: metadata || null,
          }),
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
    },
    []
  );

  return { track };
}
