export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import ReviewsModerationClient from './ReviewsModerationClient';
import Navbar from '@/components/Navbar';

export default async function AdminReviewsPage() {
  const token = cookies().get('bb_token')?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || (session as any).role !== 'admin') redirect('/login');
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Review Moderation</h1>
        <ReviewsModerationClient />
      </div>
    </>
  );
}
