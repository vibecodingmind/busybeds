export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const token = cookies().get('bb_token')?.value;
  const session = token ? verifyToken(token) : null;
  if (!session) redirect('/login');
  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">All Notifications</h1>
        <NotificationsClient />
      </div>
    </>
  );
}
