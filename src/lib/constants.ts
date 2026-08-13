/** BusyBeds platform constants — align with business logic v1.2 */

export const MIN_STAY_NIGHTS = Number(process.env.MIN_STAY_NIGHTS ?? 3);

export const DEPOSIT_WINDOW_HOURS = Number(process.env.DEPOSIT_WINDOW_HOURS ?? 3);

export const DEPOSIT_WINDOW_MS = DEPOSIT_WINDOW_HOURS * 60 * 60 * 1000;

export const MAX_AUTO_DISCOUNT_PERCENT = Number(
  process.env.MAX_AUTO_DISCOUNT_PERCENT ?? 25,
);

export const SUBSCRIPTION_GRACE_DAYS = Number(
  process.env.SUBSCRIPTION_GRACE_DAYS ?? 7,
);

export const COUPON_CODE_PREFIX = "BB";
