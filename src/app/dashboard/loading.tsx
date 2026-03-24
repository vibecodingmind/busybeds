export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 h-16 animate-pulse" />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />

        {/* Subscription card */}
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Coupons list */}
        <div className="space-y-3">
          <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
