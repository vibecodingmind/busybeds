export const dynamic = 'force-dynamic';
import RevenueClient from './RevenueClient';

export default async function RevenuePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Revenue & Growth</h1>
      <RevenueClient />
    </div>
  );
}
