import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding BusyBeds database...");

  const plans = [
    {
      slug: "bronze",
      name: "Bronze",
      description: "Basic member discounts",
      priceAmount: 9.99,
      priceCurrency: "USD",
      interval: "month",
      sortOrder: 1,
      couponValidityPolicy: { validUntil: "CHECK_OUT" },
      features: ["Basic hotel access", "Member rate visibility"],
    },
    {
      slug: "silver",
      name: "Silver",
      description: "More hotels and benefits",
      priceAmount: 19.99,
      priceCurrency: "USD",
      interval: "month",
      sortOrder: 2,
      couponValidityPolicy: { validUntil: "CHECK_OUT_PLUS_24H" },
      features: ["Expanded hotel network", "Priority support"],
    },
    {
      slug: "gold",
      name: "Gold",
      description: "Premium hotels and rates",
      priceAmount: 39.99,
      priceCurrency: "USD",
      interval: "month",
      sortOrder: 3,
      couponValidityPolicy: { validUntil: "CHECK_OUT_PLUS_48H" },
      features: ["Premium hotels", "Better STO access"],
    },
    {
      slug: "platinum",
      name: "Platinum",
      description: "VIP benefits",
      priceAmount: 79.99,
      priceCurrency: "USD",
      interval: "month",
      sortOrder: 4,
      couponValidityPolicy: { validUntil: "CHECK_OUT_PLUS_72H" },
      features: ["VIP benefits", "Top tier rates"],
    },
    {
      slug: "corporate",
      name: "Corporate",
      description: "Company seat-based memberships",
      priceAmount: 499,
      priceCurrency: "USD",
      interval: "month",
      sortOrder: 5,
      couponValidityPolicy: { validUntil: "CHECK_OUT" },
      features: ["Seat management", "Usage reporting"],
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  const passwordHash = await bcrypt.hash("admin123!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@busybeds.com" },
    update: {},
    create: {
      email: "admin@busybeds.com",
      emailVerified: new Date(),
      passwordHash,
      firstName: "BusyBeds",
      lastName: "Admin",
      platformRole: "SUPER_ADMIN",
    },
  });

  const hotelOrg = await prisma.organization.upsert({
    where: { id: "seed-hotel-org" },
    update: {},
    create: {
      id: "seed-hotel-org",
      type: "HOTEL",
      name: "Zanzibar Beach Resort",
    },
  });

  const hotel = await prisma.hotel.upsert({
    where: { slug: "zanzibar-beach-resort" },
    update: {},
    create: {
      organizationId: hotelOrg.id,
      name: "Zanzibar Beach Resort",
      slug: "zanzibar-beach-resort",
      description:
        "Oceanfront resort on Zanzibar with premium rooms and member-exclusive STO rates.",
      country: "Tanzania",
      city: "Zanzibar",
      category: "resort",
      status: "APPROVED",
      currency: "USD",
      amenities: ["Pool", "Beach", "Spa", "Restaurant", "WiFi"],
      approvedAt: new Date(),
      approvedById: superAdmin.id,
    },
  });

  const deluxeRoom = await prisma.roomType.upsert({
    where: { id: "seed-deluxe-room" },
    update: {},
    create: {
      id: "seed-deluxe-room",
      hotelId: hotel.id,
      name: "Deluxe Ocean Room",
      description: "Spacious room with ocean view",
      maxOccupancy: 2,
      bedType: "King",
      amenities: ["Ocean view", "AC", "Mini bar"],
    },
  });

  const now = new Date();
  const validTo = new Date(now);
  validTo.setFullYear(validTo.getFullYear() + 1);

  await prisma.pricingRule.upsert({
    where: { id: "seed-pricing-deluxe" },
    update: {},
    create: {
      id: "seed-pricing-deluxe",
      roomTypeId: deluxeRoom.id,
      stoAmount: 120,
      rackAmount: 200,
      currency: "USD",
      context: "DEFAULT",
      validFrom: now,
      validTo,
      minStayNights: 3,
      status: "APPROVED",
      approvedAt: now,
      approvedById: superAdmin.id,
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@zanzibar-resort.com" },
    update: {},
    create: {
      email: "owner@zanzibar-resort.com",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash("hotel123!", 12),
      firstName: "Resort",
      lastName: "Owner",
      platformRole: "MEMBER",
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      id: "seed-owner-role",
    },
    update: {},
    create: {
      id: "seed-owner-role",
      userId: ownerUser.id,
      organizationId: hotelOrg.id,
      hotelRole: "OWNER",
    },
  });

  console.log("✅ Seed complete");
  console.log("   Super admin: admin@busybeds.com / admin123!");
  console.log("   Hotel owner: owner@zanzibar-resort.com / hotel123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
