import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* Big illustrated 404 */}
        <div className="relative mb-8">
          <div
            className="text-[120px] sm:text-[160px] font-extrabold leading-none select-none"
            style={{ color: '#E6F4F4' }}
          >
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-6xl">
            🏨
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Room not found
        </h1>
        <p className="text-gray-500 max-w-sm mb-8">
          The page you're looking for has checked out. Let's get you back to the lobby.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="btn-primary">
            Browse Hotels
          </Link>
          <Link href="/dashboard" className="btn-outline">
            Go to Dashboard
          </Link>
        </div>

        {/* Decorative dots */}
        <div className="flex gap-2 mt-12">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 2 ? 12 : 8,
                height: i === 2 ? 12 : 8,
                background: i === 2 ? '#0E7C7B' : '#D1D5DB',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
