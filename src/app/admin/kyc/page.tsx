export const revalidate = 0;

import KycClient from './KycClient';
import prisma from '@/lib/prisma';

export const metadata = { title: 'Claims & KYC — BusyBeds Admin' };

export default async function KycPage() {
  const applications = await prisma.hotelOwner.findMany({
    include: {
      user:  { select: { fullName: true, email: true, avatar: true, createdAt: true } },
      hotel: { select: { name: true, city: true, country: true, starRating: true, coverImage: true } },
    },
    orderBy: { kycSubmittedAt: 'desc' },
  });
  return <KycClient initialApplications={applications as any} />;
}
