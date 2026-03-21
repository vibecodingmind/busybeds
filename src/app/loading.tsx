// Root loading skeleton — shown while the home page server component fetches data
export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar skeleton */}
      <div className="bg-white border-b border-gray-100 h-16 flex items-center px-6 justify-between">
        <div className="h-6 w-28 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex gap-3">
          <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-64 sm:h-72" style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E7C7B 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-14 flex flex-col items-center gap-4">
          <div className="h-4 w-48 bg-white/20 rounded-full animate-pulse" />
          <div className="h-8 w-72 bg-white/20 rounded-xl animate-pulse" />
          <div className="h-8 w-64 bg-white/20 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-white/20 rounded-2xl animate-pulse mt-2" />
        </div>
      </div>

      {/* Filter pills skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-2 flex-wrap">
        {[80, 64, 72, 56, 68].map(w => (
          <div key={w} className="h-9 rounded-full bg-gray-200 animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Hotel card grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-100 rounded-lg animate-pulse" />
              <div className="pt-2 border-t border-gray-100 flex justify-between">
                <div className="h-4 w-8 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
