export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 h-16 animate-pulse" />

      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        {/* Title */}
        <div className="h-8 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />

        {/* Scan box */}
        <div className="card p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
