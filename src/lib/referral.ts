/**
 * Shared referral reward helper
 *
 * Called when a user's subscription is activated (Stripe, Pesapal, etc.)
 * Checks if the new subscriber was referred by someone, and if so:
 *  - Creates a ReferralEarning record (one-time, first payment only)
 *  - Sends a notification to the referrer
 *
 * Settings (reward %, hold days) are read from SiteSettings in the DB,
 * with hardcoded defaults as fallback.
 */

import prisma from '@/lib/prisma';

interface ReferralSettings {
  rewardPercent: number;   // % of subscription price paid to referrer
  holdDays: number;        // days before earnings become withdrawable
}

async function getReferralSettings(): Promise<ReferralSettings> {
  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: ['referralRewardPercent', 'referralHoldDays'] } },
    });
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
      rewardPercent: parseFloat(map.referralRewardPercent ?? '20'),
      holdDays:      parseInt(map.referralHoldDays ?? '30', 10),
    };
  } catch {
    return { rewardPercent: 20, holdDays: 30 };
  }
}

/**
 * Award a referral commission to the referrer of `newUserId`.
 * Safe to call multiple times — guards against duplicate earnings
 * by checking if a ReferralEarning for this referredId already exists.
 *
 * @param newUserId       - the user who just paid their first subscription
 * @param subscriptionId  - the new subscription id
 * @param priceUsd        - the subscription price in USD
 */
export async function awardReferralEarning(
  newUserId: string,
  subscriptionId: string,
  priceUsd: number,
): Promise<void> {
  try {
    // Only reward for real paid subscriptions
    if (priceUsd <= 0) return;

    // Check if this user was referred
    const referralUse = await prisma.referralUse.findUnique({
      where: { referredId: newUserId },
    });
    if (!referralUse) return;

    // Guard: only one earning per referred user (first subscription only)
    const existing = await prisma.referralEarning.findFirst({
      where: { referredId: newUserId },
    });
    if (existing) return;

    const { rewardPercent, holdDays } = await getReferralSettings();

    const earningAmount = Math.round(priceUsd * (rewardPercent / 100) * 100) / 100;
    if (earningAmount <= 0) return;

    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + holdDays);

    await prisma.referralEarning.create({
      data: {
        referrerId:     referralUse.referrerId,
        referredId:     newUserId,
        amount:         earningAmount,
        subscriptionId,
        availableAt,
      },
    });

    // Notify referrer
    await prisma.notification.create({
      data: {
        userId:  referralUse.referrerId,
        title:   'Referral Commission Earned! 🎉',
        message: `You earned $${earningAmount.toFixed(2)} (${rewardPercent}%) from a referral. Available in ${holdDays} days.`,
        type:    'referral',
        link:    '/referral#earnings',
      },
    });
  } catch (err) {
    console.error('[awardReferralEarning] Error:', err);
    // Non-fatal — don't block subscription activation
  }
}
