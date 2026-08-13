import { MAX_AUTO_DISCOUNT_PERCENT } from "@/lib/constants";

export interface SavingsResult {
  rackAmount: number;
  stoAmount: number;
  savingAmount: number;
  discountPercent: number;
  requiresAdminApproval: boolean;
}

/**
 * Calculate member savings from rack (BusyBeds display) and STO (member rate).
 */
export function calculateSavings(
  rackAmount: number,
  stoAmount: number,
): SavingsResult {
  const savingAmount = Math.max(0, rackAmount - stoAmount);
  const discountPercent =
    rackAmount > 0 ? Math.round((savingAmount / rackAmount) * 1000) / 10 : 0;

  return {
    rackAmount,
    stoAmount,
    savingAmount,
    discountPercent,
    requiresAdminApproval: discountPercent > MAX_AUTO_DISCOUNT_PERCENT,
  };
}

/**
 * Minimum rack for a given STO at max auto discount (25%).
 */
export function minimumRackForSto(stoAmount: number): number {
  const factor = 1 - MAX_AUTO_DISCOUNT_PERCENT / 100;
  if (factor <= 0) return stoAmount;
  return Math.ceil((stoAmount / factor) * 100) / 100;
}

/**
 * Validate stay length meets minimum nights.
 */
export function validateMinStay(nights: number, minNights: number): boolean {
  return nights >= minNights;
}

/**
 * Compute nights between check-in and check-out dates.
 */
export function computeNights(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
