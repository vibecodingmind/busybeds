import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List all subscription tiers
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tiers = await prisma.hotelSubscriptionTier.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { subscriptions: { where: { status: 'active' } } },
      },
    },
  });

  return NextResponse.json({ tiers });
}

// POST - Create or update tier
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  
  const tier = await prisma.hotelSubscriptionTier.upsert({
    where: { id: data.id || '' },
    update: {
      displayName: data.displayName,
      priceMonthly: data.priceMonthly,
      priceAnnual: data.priceAnnual,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      featuredOnHomepage: data.featuredOnHomepage,
      featuredPriority: data.featuredPriority,
      searchBoost: data.searchBoost,
      flashDealsPerMonth: data.flashDealsPerMonth,
      showVerifiedBadge: data.showVerifiedBadge,
      promotionalEmails: data.promotionalEmails,
      customBookingLink: data.customBookingLink,
      prioritySupport: data.prioritySupport,
      apiAccess: data.apiAccess,
      analyticsLevel: data.analyticsLevel,
      stripePriceIdMonthly: data.stripePriceIdMonthly,
      stripePriceIdAnnual: data.stripePriceIdAnnual,
    },
    create: {
      name: data.name,
      displayName: data.displayName,
      priceMonthly: data.priceMonthly,
      priceAnnual: data.priceAnnual,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      featuredOnHomepage: data.featuredOnHomepage,
      featuredPriority: data.featuredPriority,
      searchBoost: data.searchBoost,
      flashDealsPerMonth: data.flashDealsPerMonth,
      showVerifiedBadge: data.showVerifiedBadge,
      promotionalEmails: data.promotionalEmails,
      customBookingLink: data.customBookingLink,
      prioritySupport: data.prioritySupport,
      apiAccess: data.apiAccess,
      analyticsLevel: data.analyticsLevel,
      stripePriceIdMonthly: data.stripePriceIdMonthly,
      stripePriceIdAnnual: data.stripePriceIdAnnual,
    },
  });

  return NextResponse.json({ tier });
}

// DELETE - Delete a tier (only if no subscriptions)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  // Check if any subscriptions exist
  const subCount = await prisma.hotelSubscription.count({
    where: { tierId: id },
  });

  if (subCount > 0) {
    return NextResponse.json({ 
      error: 'Cannot delete tier with existing subscriptions. Deactivate it instead.' 
    }, { status: 400 });
  }

  await prisma.hotelSubscriptionTier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
