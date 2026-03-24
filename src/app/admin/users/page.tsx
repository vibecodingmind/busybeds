export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import UsersClient from './UsersClient';

export const metadata = { title: 'User Management — BusyBeds Admin' };

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">User Management</h1>
      <UsersClient />
    </div>
  );
}
