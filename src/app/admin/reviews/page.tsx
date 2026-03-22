export const dynamic = 'force-dynamic';
import ReviewsModerationClient from './ReviewsModerationClient';

export default async function AdminReviewsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Review Moderation</h1>
      <ReviewsModerationClient />
    </div>
  );
}
