/**
 * Simple in-memory rate limiter.
 * Works well for single-instance deployments (local dev, single Vercel region).
 * For multi-region production, swap the Map for Redis (Upstash, etc).
 * 
 * NOTE: This implementation has a max size limit to prevent memory exhaustion.
 */

interface RateEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateEntry>();

// Configuration
const MAX_STORE_SIZE = 10000; // Maximum entries to prevent memory exhaustion

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

/**
 * Returns { success: true } if within limit, or { success: false, retryAfter } if exceeded.
 * `identifier` should be something like `${ip}:${route}`.
 */
export function rateLimit(
  identifier: string,
  { limit, windowSec }: RateLimitOptions
): { success: true } | { success: false; retryAfter: number } {
  const now = Date.now();
  const existing = store.get(identifier);

  // If store is at max capacity and this is a new entry, reject to prevent memory exhaustion
  if (!existing && store.size >= MAX_STORE_SIZE) {
    // Try to clean up expired entries first
    for (const [key, entry] of Array.from(store.entries())) {
      if (entry.resetAt < now) store.delete(key);
    }
    // If still at capacity, use LRU-style eviction (remove oldest entry)
    if (store.size >= MAX_STORE_SIZE) {
      const firstKey = store.keys().next().value;
      if (firstKey) store.delete(firstKey);
    }
  }

  if (!existing || existing.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + windowSec * 1000 });
    return { success: true };
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return { success: false, retryAfter };
  }

  existing.count++;
  return { success: true };
}

/** Helper: extract best-effort IP from a Next.js request */
export function getIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
