import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import LoyaltyDashboard from './LoyaltyDashboard';

export const dynamic = 'force-dynamic';

export default async function LoyaltyPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/loyalty');
  return (
    <>
      <Navbar />
      <LoyaltyDashboard />
    </>
  );
}
