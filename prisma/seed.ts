import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Busy Beds database...');

  // ── Subscription Packages ──────────────────────────────────
  const packages = await Promise.all([
    prisma.subscriptionPackage.upsert({
      where: { id: 'pkg_explorer' },
      update: {},
      create: { id: 'pkg_explorer', name: 'Explorer', priceMonthly: 9, durationDays: 30, couponLimitPerPeriod: 3, tier: 'basic' },
    }),
    prisma.subscriptionPackage.upsert({
      where: { id: 'pkg_adventurer' },
      update: {},
      create: { id: 'pkg_adventurer', name: 'Adventurer', priceMonthly: 19, durationDays: 30, couponLimitPerPeriod: 10, tier: 'standard' },
    }),
    prisma.subscriptionPackage.upsert({
      where: { id: 'pkg_elite' },
      update: {},
      create: { id: 'pkg_elite', name: 'Elite', priceMonthly: 39, durationDays: 30, couponLimitPerPeriod: 100, tier: 'premium' },
    }),
  ]);
  console.log(`✓ Created ${packages.length} subscription packages`);

  // ── Admin User ─────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@busybeds.com' },
    update: {},
    create: {
      email: 'admin@busybeds.com',
      passwordHash: hashSync('admin123', 12),
      fullName: 'Platform Admin',
      role: 'admin',
    },
  });
  console.log(`✓ Admin user: ${admin.email} / admin123`);

  // ── Hotel Types ────────────────────────────────────────────
  const hotelTypes = [
    { name: 'Hotel', icon: 'hotel', sortOrder: 1 },
    { name: 'Resort', icon: 'resort', sortOrder: 2 },
    { name: 'Villa', icon: 'villa', sortOrder: 3 },
    { name: 'Apartment', icon: 'apartment', sortOrder: 4 },
    { name: 'Boutique', icon: 'boutique', sortOrder: 5 },
    { name: 'Lodge', icon: 'lodge', sortOrder: 6 },
    { name: 'Guesthouse', icon: 'guesthouse', sortOrder: 7 },
    { name: 'Hostel', icon: 'hostel', sortOrder: 8 },
    { name: 'Motel', icon: 'motel', sortOrder: 9 },
    { name: 'B&B', icon: 'bnb', sortOrder: 10 },
    { name: 'Camping', icon: 'camping', sortOrder: 11 },
    { name: 'Beach', icon: 'beach', sortOrder: 12 },
  ];

  for (const ht of hotelTypes) {
    await prisma.hotelType.upsert({
      where: { name: ht.name },
      update: { icon: ht.icon, sortOrder: ht.sortOrder },
      create: ht,
    });
  }
  console.log(`✓ Created ${hotelTypes.length} hotel types`);

  // ── Default Amenities ──────────────────────────────────────
  const amenities = [
    { name: 'Free WiFi', icon: '📶', category: 'connectivity' },
    { name: 'Swimming Pool', icon: '🏊', category: 'recreation' },
    { name: 'Spa', icon: '💆', category: 'wellness' },
    { name: 'Gym', icon: '🏋️', category: 'wellness' },
    { name: 'Restaurant', icon: '🍽️', category: 'dining' },
    { name: 'Bar', icon: '🍹', category: 'dining' },
    { name: 'Room Service', icon: '🛎️', category: 'service' },
    { name: 'Free Parking', icon: '🅿️', category: 'practical' },
    { name: 'Airport Shuttle', icon: '🚐', category: 'transport' },
    { name: 'Beach Access', icon: '🏖️', category: 'recreation' },
    { name: 'Air Conditioning', icon: '❄️', category: 'comfort' },
    { name: 'Laundry Service', icon: '👕', category: 'service' },
    { name: '24/7 Reception', icon: '🕐', category: 'service' },
    { name: 'Concierge', icon: '🎩', category: 'service' },
    { name: 'Pet Friendly', icon: '🐕', category: 'practical' },
  ];

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: { icon: amenity.icon, category: amenity.category },
      create: amenity,
    });
  }
  console.log(`✓ Created ${amenities.length} default amenities`);

  console.log('\n🎉 Seed complete! Admin account:');
  console.log('   Admin: admin@busybeds.com / admin123');
  console.log('\n⚠️  Remember to change the admin password in production!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
