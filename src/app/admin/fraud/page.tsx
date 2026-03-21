export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import FraudClient from './FraudClient';
import Navbar from '@/components/Navbar';

export default async function FraudPage() {
  const token = cookies().get('bb_token')?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || (session as any).role !== 'admin') redirect('/login');
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fraud Detection</h1>
        <p className="text-gray-500 mb-8">Users flagged for suspicious coupon activity in the last 7 days</p>
        <FraudClient />
      </div>
    </>
  );
}
