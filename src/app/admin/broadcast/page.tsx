export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import BroadcastClient from './BroadcastClient';

export default async function BroadcastPage() {
  const token = cookies().get('bb_token')?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || (session as any).role !== 'admin') redirect('/login');
  return <BroadcastClient />;
}
