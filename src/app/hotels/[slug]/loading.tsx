export default function HotelPageLoading() {
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

      {/* Hero image skeleton */}
      <div className="relative h-72 sm:h-96 bg-gray-200 animate-pulse" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel name + rating */}
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-5 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
              <div className="flex gap-2">
                {[60, 72, 56, 80].map(w => (
                  <div key={w} className="h-7 rounded-full bg-gray-200 animate-pulse" style={{ width: w }} />
                ))}
              </div>
            </div>
            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
            </div>
            {/* Amenities */}
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
            {/* Room types */}
            <div className="space-y-3">
              <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>

          {/* Right: coupon card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-gray-200 animate-pulse mx-auto" />
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse mx-auto" />
              <div className="h-5 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-4/5 bg-gray-100 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
