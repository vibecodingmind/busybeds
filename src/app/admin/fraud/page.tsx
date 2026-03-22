export const dynamic = 'force-dynamic';
import FraudClient from './FraudClient';

export default async function FraudPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fraud Detection</h1>
      <p className="text-gray-500 mb-8">Users flagged for suspicious coupon activity in the last 7 days</p>
      <FraudClient />
    </div>
  );
}
