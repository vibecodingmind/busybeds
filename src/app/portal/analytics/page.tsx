export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import AnalyticsDashboard from './AnalyticsDashboard';

export default async function AnalyticsPage() {
  const token = cookies().get('bb_token')?.value;
  const session = token ? verifyToken(token) : null;
  if (!session) redirect('/login');
  const s = session as any;
  if (!['hotel_owner', 'hotel_manager', 'admin'].includes(s.role)) redirect('/dashboard');
  return (
    <>
      <Navbar />
      <AnalyticsDashboard />
    </>
  );
}
