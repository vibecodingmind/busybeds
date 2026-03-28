import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const metadata = { title: 'Hotel Portal — BusyBeds' };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!['hotel_owner', 'hotel_manager', 'admin'].includes(session.role as string)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
