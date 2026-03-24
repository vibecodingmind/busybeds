import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import UpgradeClient from './UpgradeClient';

export const metadata = { title: 'Upgrade Your Plan — BusyBeds' };

async function getData(userId: string) {
  const hotelOwner = await prisma.hotelOwner.findUnique({
    where: { userId },
    include: { 
      hotel: { 
        select: { 
          id: true, 
          name: true, 
          city: true, 
          slug: true,
          adminFeatured: true,
          adminFeaturedUntil: true,
        } 
      } 
    },
  });
  if (!hotelOwner) return null;

  // Get current subscription
  const subscription = await prisma.hotelSubscription.findUnique({
    where: { hotelId: hotelOwner.hotel.id },
    include: { tier: true },
  });

  // Get all active tiers
  const tiers = await prisma.hotelSubscriptionTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return { 
    hotel: hotelOwner.hotel, 
    subscription,
    tiers,
  };
}

export default async function OwnerUpgradePage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/owner/upgrade');

  const data = await getData(session.userId);

  if (!data) {
    redirect('/owner');
  }

  const { hotel, subscription, tiers } = data;

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Your Hotel</h1>
          <p className="text-gray-500">Get more visibility, features, and bookings with a premium plan</p>
          <p className="text-sm text-gray-400 mt-1">Managing: <span className="font-medium">{hotel.name}</span></p>
        </div>
        <UpgradeClient 
          hotel={hotel} 
          currentSubscription={subscription} 
          tiers={tiers as any} 
        />
      </div>
    </div>
  );
}
