export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2 animate-pulse" />
          <div className="h-4 w-80 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Charts Skeleton */}
        <div className="space-y-6">
          {/* Daily Redemptions Skeleton */}
          <div className="card p-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg mb-4 animate-pulse" />
            <div className="flex items-end gap-2 h-40">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-300 rounded animate-pulse"
                  style={{ height: `${Math.random() * 100 + 20}px` }}
                />
              ))}
            </div>
          </div>

          {/* Top Hotels Skeleton */}
          <div className="card p-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg mb-4 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 w-full bg-gray-300 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Plans Stats Skeleton */}
          <div className="card p-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-gray-200 rounded-lg h-32 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Monthly Signups Skeleton */}
          <div className="card p-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg mb-4 animate-pulse" />
            <div className="flex items-end gap-3 h-40">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-300 rounded animate-pulse"
                  style={{ height: `${Math.random() * 100 + 20}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
