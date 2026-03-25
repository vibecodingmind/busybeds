import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding hotel subscription tiers...');

  const tiers = [
    {
      name: 'free',
      displayName: 'Free',
      priceMonthly: 0,
      priceAnnual: 0,
      isActive: true,
      sortOrder: 0,
      featuredOnHomepage: false,
      featuredPriority: 0,
      searchBoost: 0,
      flashDealsPerMonth: 0,
      showVerifiedBadge: false,
      promotionalEmails: 0,
      customBookingLink: false,
      prioritySupport: false,
      apiAccess: false,
      analyticsLevel: 'basic',
    },
    {
      name: 'starter',
      displayName: 'Starter',
      priceMonthly: 19,
      priceAnnual: 190, // ~17% discount
      isActive: true,
      sortOrder: 1,
      featuredOnHomepage: true,
      featuredPriority: 1,
      searchBoost: 10,
      flashDealsPerMonth: 1,
      showVerifiedBadge: true,
      promotionalEmails: 0,
      customBookingLink: false,
      prioritySupport: false,
      apiAccess: false,
      analyticsLevel: 'basic',
    },
    {
      name: 'growth',
      displayName: 'Growth',
      priceMonthly: 49,
      priceAnnual: 490, // ~17% discount
      isActive: true,
      sortOrder: 2,
      featuredOnHomepage: true,
      featuredPriority: 2,
      searchBoost: 25,
      flashDealsPerMonth: 3,
      showVerifiedBadge: true,
      promotionalEmails: 1,
      customBookingLink: true,
      prioritySupport: true,
      apiAccess: false,
      analyticsLevel: 'enhanced',
    },
    {
      name: 'premium',
      displayName: 'Premium',
      priceMonthly: 99,
      priceAnnual: 990, // ~17% discount
      isActive: true,
      sortOrder: 3,
      featuredOnHomepage: true,
      featuredPriority: 3,
      searchBoost: 50,
      flashDealsPerMonth: 999, // Unlimited
      showVerifiedBadge: true,
      promotionalEmails: 999, // Unlimited
      customBookingLink: true,
      prioritySupport: true,
      apiAccess: true,
      analyticsLevel: 'full',
    },
  ];

  for (const tier of tiers) {
    await prisma.hotelSubscriptionTier.upsert({
      where: { name: tier.name },
      update: tier,
      create: tier,
    });
    console.log(`✓ Upserted tier: ${tier.displayName}`);
  }

  console.log('Done seeding hotel subscription tiers!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
