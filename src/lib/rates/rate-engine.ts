import type { PricingContext, PricingRule } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateSavings } from "@/lib/rates/discount";

const CONTEXT_PRIORITY: Record<PricingContext, number> = {
  HOLIDAY: 1,
  WEEKEND: 2,
  HIGH_SEASON: 3,
  LOW_SEASON: 4,
  DEFAULT: 5,
};

function contextMatchesDate(rule: PricingRule, date: Date): boolean {
  if (rule.holidayDate) {
    const h = new Date(rule.holidayDate);
    if (
      h.getFullYear() === date.getFullYear() &&
      h.getMonth() === date.getMonth() &&
      h.getDate() === date.getDate()
    ) {
      return rule.context === "HOLIDAY";
    }
  }

  const day = date.getDay();
  const isFriday = day === 5;
  const isSaturday = day === 6;
  const isSunday = day === 0;

  if (rule.context === "WEEKEND") {
    return (
      (rule.appliesFriday && isFriday) ||
      (rule.appliesSaturday && isSaturday) ||
      (rule.appliesSunday && isSunday)
    );
  }

  if (rule.context === "DEFAULT" || rule.context === "HIGH_SEASON" || rule.context === "LOW_SEASON") {
    return true;
  }

  return false;
}

export interface ResolvedRate {
  ruleId: string;
  stoAmount: number;
  rackAmount: number;
  currency: string;
  context: PricingContext;
  savings: ReturnType<typeof calculateSavings>;
}

export async function resolveRateForDate(
  roomTypeId: string,
  date: Date,
): Promise<ResolvedRate | null> {
  const rules = await prisma.pricingRule.findMany({
    where: {
      roomTypeId,
      status: "APPROVED",
      validFrom: { lte: date },
      validTo: { gte: date },
    },
  });

  const matching = rules
    .filter((r) => contextMatchesDate(r, date))
    .sort(
      (a, b) => CONTEXT_PRIORITY[a.context] - CONTEXT_PRIORITY[b.context],
    );

  const rule = matching[0];
  if (!rule) return null;

  const sto = Number(rule.stoAmount);
  const rack = Number(rule.rackAmount);

  return {
    ruleId: rule.id,
    stoAmount: sto,
    rackAmount: rack,
    currency: rule.currency,
    context: rule.context,
    savings: calculateSavings(rack, sto),
  };
}

export async function resolveRateForStay(
  roomTypeId: string,
  checkIn: Date,
): Promise<ResolvedRate | null> {
  return resolveRateForDate(roomTypeId, checkIn);
}
