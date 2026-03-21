export default function CouponsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 h-16 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-5 w-28 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        {/* two-panel */}
        <div className="flex gap-4">
          {/* left */}
          <div className="w-80 flex-shrink-0 space-y-2">
            <div className="flex gap-1.5 mb-3">
              {[80, 70, 76, 80].map((w, i) => (
                <div key={i} className="h-7 rounded-xl bg-gray-200 animate-pulse" style={{ width: w }} />
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3">
                <div className="w-11 h-11 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          {/* right */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-center">
            <div className="w-full max-w-xs space-y-3">
              <div className="h-20 w-full bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-28 w-full bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-36 w-36 mx-auto bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
