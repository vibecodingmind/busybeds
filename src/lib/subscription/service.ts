import { prisma } from "@/lib/db";
import type { PaymentProvider } from "@prisma/client";

export async function activateSubscription(
  userId: string,
  planId: string,
  provider: PaymentProvider = "STRIPE",
  providerSubscriptionId?: string,
) {
  const plan = await prisma.membershipPlan.findUniqueOrThrow({
    where: { id: planId },
  });

  const now = new Date();
  const periodEnd = new Date(now);
  if (plan.interval === "year") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await prisma.subscription.updateMany({
    where: { userId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    data: { status: "CANCELLED" },
  });

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      provider,
      providerSubscriptionId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await prisma.paymentRecord.create({
    data: {
      subscriptionId: subscription.id,
      provider,
      amount: plan.priceAmount,
      currency: plan.priceCurrency,
      status: "succeeded",
    },
  });

  await prisma.loyaltyAccount.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  });

  return subscription;
}

export async function getMembershipPlans() {
  return prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
