import { prisma } from "@/lib/db";

const POINTS_REDEMPTION = 50;

export async function awardRedemptionPoints(userId: string, bookingId: string) {
  const account = await prisma.loyaltyAccount.upsert({
    where: { userId },
    create: { userId, balance: POINTS_REDEMPTION },
    update: { balance: { increment: POINTS_REDEMPTION } },
  });

  await prisma.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      amount: POINTS_REDEMPTION,
      reason: "HOTEL_VISIT",
      referenceId: bookingId,
    },
  });

  return account;
}

export async function getLoyaltyBalance(userId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  return account;
}
