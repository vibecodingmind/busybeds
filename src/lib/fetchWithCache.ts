/**
 * Fetch with cache-busting headers to prevent stale data
 * Use this for all API calls that should never be cached
 */
export async function fetchWithCache(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Add timestamp to URL to bust cache
  const separator = url.includes('?') ? '&' : '?';
  const cacheBustedUrl = `${url}${separator}_t=${Date.now()}`;

  const defaultHeaders: HeadersInit = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  return fetch(cacheBustedUrl, {
    ...options,
    cache: 'no-store',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
}

/**
 * Fetch JSON with cache-busting
 */
export async function fetchJsonWithCache<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithCache(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
