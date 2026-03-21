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
      create: { id: 'pkg_explorer', name: 'Explorer', priceMonthly: 9, durationDays: 30, couponLimitPerPeriod: 3 },
    }),
    prisma.subscriptionPackage.upsert({
      where: { id: 'pkg_adventurer' },
      update: {},
      create: { id: 'pkg_adventurer', name: 'Adventurer', priceMonthly: 19, durationDays: 30, couponLimitPerPeriod: 10 },
    }),
    prisma.subscriptionPackage.upsert({
      where: { id: 'pkg_elite' },
      update: {},
      create: { id: 'pkg_elite', name: 'Elite', priceMonthly: 39, durationDays: 30, couponLimitPerPeriod: 100 },
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

  // ── Demo Traveler ──────────────────────────────────────────
  const traveler = await prisma.user.upsert({
    where: { email: 'traveler@demo.com' },
    update: {},
    create: {
      email: 'traveler@demo.com',
      passwordHash: hashSync('demo123', 12),
      fullName: 'Alex Traveler',
      role: 'traveler',
    },
  });

  // Give demo traveler an active subscription
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.subscription.upsert({
    where: { id: 'sub_demo_traveler' },
    update: {},
    create: {
      id: 'sub_demo_traveler',
      userId: traveler.id,
      packageId: packages[1].id,
      status: 'active',
      expiresAt,
    },
  });
  console.log(`✓ Demo traveler: ${traveler.email} / demo123 (Adventurer plan)`);

  // ── Hotels ─────────────────────────────────────────────────
  const hotelsData = [
    {
      id: 'hotel_1',
      name: 'The Grand Riviera',
      slug: 'the-grand-riviera',
      city: 'Dubai',
      country: 'UAE',
      descriptionShort: 'Luxury beachfront hotel with stunning views of the Arabian Gulf.',
      descriptionLong: 'Experience unparalleled luxury at The Grand Riviera, where world-class amenities meet breathtaking Arabian Gulf views. Our 5-star property features 350 rooms and suites, multiple award-winning restaurants, a private beach, and an expansive spa.',
      starRating: 5,
      amenities: JSON.stringify(['Free WiFi', 'Private Beach', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Room Service', 'Concierge']),
      websiteUrl: 'https://example.com',
      discountPercent: 20,
      isFeatured: true,
      coverImage: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    },
    {
      id: 'hotel_2',
      name: 'City Lights Boutique',
      slug: 'city-lights-boutique',
      city: 'London',
      country: 'UK',
      descriptionShort: 'Stylish boutique hotel in the heart of Central London.',
      descriptionLong: 'City Lights Boutique is a design-led hotel nestled in the heart of Central London. Just steps from iconic landmarks, our property combines modern British aesthetics with warm hospitality.',
      starRating: 4,
      amenities: JSON.stringify(['Free WiFi', 'Breakfast', 'Bar', 'Gym', 'Concierge', '24h Reception']),
      discountPercent: 15,
      coverImage: 'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=800',
    },
    {
      id: 'hotel_3',
      name: 'Sakura Garden Hotel',
      slug: 'sakura-garden-hotel',
      city: 'Tokyo',
      country: 'Japan',
      descriptionShort: 'Traditional Japanese hospitality meets modern comfort in central Tokyo.',
      descriptionLong: 'Sakura Garden Hotel offers an authentic Japanese experience in the heart of Tokyo. Featuring traditional tatami rooms alongside modern Western-style suites, our hotel blends cultural heritage with contemporary comfort.',
      starRating: 4,
      amenities: JSON.stringify(['Free WiFi', 'Onsen', 'Traditional Breakfast', 'Tea Ceremony', 'Zen Garden']),
      discountPercent: 12,
      coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    },
    {
      id: 'hotel_4',
      name: 'Sunset Palms Resort',
      slug: 'sunset-palms-resort',
      city: 'Bali',
      country: 'Indonesia',
      descriptionShort: 'Tropical paradise resort with infinity pools and jungle views.',
      descriptionLong: 'Nestled in the lush hills of Ubud, Sunset Palms Resort is your gateway to Bali\'s natural beauty. Our eco-friendly resort features private pool villas, open-air yoga pavilions, and farm-to-table dining.',
      starRating: 5,
      amenities: JSON.stringify(['Free WiFi', 'Infinity Pool', 'Yoga', 'Spa', 'Restaurant', 'Airport Transfer']),
      discountPercent: 25,
      isFeatured: true,
      coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    },
    {
      id: 'hotel_5',
      name: 'The Manhattan Stay',
      slug: 'the-manhattan-stay',
      city: 'New York',
      country: 'USA',
      descriptionShort: 'Premium hotel in Midtown Manhattan with skyline views.',
      descriptionLong: 'The Manhattan Stay puts you at the center of it all. Located in Midtown Manhattan, our hotel offers breathtaking skyline views, rooftop bar, and easy access to Times Square, Central Park, and world-class dining.',
      starRating: 4,
      amenities: JSON.stringify(['Free WiFi', 'Rooftop Bar', 'Gym', 'Business Center', 'Concierge', 'Valet Parking']),
      discountPercent: 18,
      coverImage: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800',
    },
    {
      id: 'hotel_6',
      name: 'Medina Riad Suites',
      slug: 'medina-riad-suites',
      city: 'Marrakech',
      country: 'Morocco',
      descriptionShort: 'Authentic Moroccan riad with courtyard pool in the historic medina.',
      descriptionLong: 'Step into a world of Moroccan splendour at Medina Riad Suites. Hidden behind ornate carved doors in the ancient medina, our riad features hand-painted zellige tiles, a central courtyard with plunge pool, and rooftop terrace.',
      starRating: 4,
      amenities: JSON.stringify(['Free WiFi', 'Courtyard Pool', 'Rooftop Terrace', 'Hammam', 'Moroccan Breakfast', 'Airport Transfer']),
      discountPercent: 22,
      coverImage: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800',
    },
  ];

  for (const h of hotelsData) {
    await prisma.hotel.upsert({
      where: { id: h.id },
      update: {},
      create: h,
    });
  }

  // Add room types
  const rooms = [
    { hotelId: 'hotel_1', name: 'Deluxe Gulf View', description: 'Spacious room with panoramic gulf views', pricePerNight: 420, maxOccupancy: 2, displayOrder: 0 },
    { hotelId: 'hotel_1', name: 'Royal Suite', description: 'Two-bedroom suite with private terrace and butler service', pricePerNight: 1200, maxOccupancy: 4, displayOrder: 1 },
    { hotelId: 'hotel_2', name: 'Classic Double', description: 'Elegant room with London city views', pricePerNight: 180, maxOccupancy: 2, displayOrder: 0 },
    { hotelId: 'hotel_2', name: 'Superior King', description: 'Larger room with premium bedding and work desk', pricePerNight: 250, maxOccupancy: 2, displayOrder: 1 },
    { hotelId: 'hotel_3', name: 'Traditional Tatami', description: 'Authentic Japanese room with futon beds', pricePerNight: 160, maxOccupancy: 2, displayOrder: 0 },
    { hotelId: 'hotel_3', name: 'Modern Western Suite', description: 'Contemporary suite with city views', pricePerNight: 280, maxOccupancy: 3, displayOrder: 1 },
    { hotelId: 'hotel_4', name: 'Pool Villa', description: 'Private villa with plunge pool and jungle views', pricePerNight: 350, maxOccupancy: 2, displayOrder: 0 },
    { hotelId: 'hotel_4', name: 'Garden Suite', description: 'Open-air suite surrounded by tropical gardens', pricePerNight: 220, maxOccupancy: 2, displayOrder: 1 },
    { hotelId: 'hotel_5', name: 'Skyline King', description: 'Modern room with floor-to-ceiling Manhattan views', pricePerNight: 380, maxOccupancy: 2, displayOrder: 0 },
    { hotelId: 'hotel_6', name: 'Riad Suite', description: 'Traditional suite with hand-painted decor', pricePerNight: 140, maxOccupancy: 2, displayOrder: 0 },
  ];

  for (const room of rooms) {
    await prisma.roomType.create({ data: room }).catch(() => {});
  }

  console.log(`✓ Created ${hotelsData.length} hotels with room types`);

  // ── Demo Hotel Owner & Manager ─────────────────────────────
  const owner = await prisma.user.upsert({
    where: { email: 'owner@grandriviera.com' },
    update: {},
    create: {
      email: 'owner@grandriviera.com',
      passwordHash: hashSync('owner123', 12),
      fullName: 'Ahmad Hassan',
      role: 'hotel_owner',
    },
  });

  await prisma.hotelOwner.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id, hotelId: 'hotel_1', kycStatus: 'approved', kycReviewedAt: new Date() },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@grandriviera.com' },
    update: {},
    create: {
      email: 'manager@grandriviera.com',
      passwordHash: hashSync('manager123', 12),
      fullName: 'Fatima Al-Rashid',
      role: 'hotel_manager',
    },
  });

  await prisma.hotelManager.upsert({
    where: { userId: manager.id },
    update: {},
    create: { userId: manager.id, hotelId: 'hotel_1', assignedBy: owner.id },
  });

  console.log(`✓ Demo owner: ${owner.email} / owner123`);
  console.log(`✓ Demo manager: ${manager.email} / manager123`);

  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('   Admin:   admin@busybeds.com      / admin123');
  console.log('   Traveler: traveler@demo.com       / demo123');
  console.log('   Owner:   owner@grandriviera.com  / owner123');
  console.log('   Manager: manager@grandriviera.com / manager123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
