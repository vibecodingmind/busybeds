export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import UsersClient from './UsersClient';

export const metadata = { title: 'User Management — BusyBeds Admin' };

export default async function AdminUsersPage() {
  const token = cookies().get('bb_token')?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || (session as any).role !== 'admin') redirect('/login');
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">User Management</h1>
      <UsersClient />
    </div>
  );
}
