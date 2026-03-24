export default function ManageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 h-16 animate-pulse" />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-4 w-40 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-7 w-12 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Content area */}
        <div className="card p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: `${70 + i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
