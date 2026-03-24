export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 h-16 animate-pulse" />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-36 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="h-6 w-8 bg-gray-200 rounded-lg animate-pulse mx-auto" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
        <div className="card p-6 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );
}
