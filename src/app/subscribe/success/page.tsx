'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubscribeSuccessPage() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push('/dashboard'), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto mb-6">
          🎉
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">You&apos;re subscribed!</h1>
        <p className="text-gray-500 mb-6">
          Your subscription is now active. Start browsing hotels and generating your discount coupons.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary">Browse Hotels →</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-teal-600">Go to Dashboard</Link>
        </div>
        <p className="text-xs text-gray-400 mt-6">Redirecting automatically in a few seconds...</p>
      </div>
    </div>
  );
}
