/**
 * Shared loyalty points helper
 * Awards points and records a transaction.
 * Safe to use anywhere — non-fatal, never blocks main flow.
 */
import prisma from '@/lib/prisma';

export async function awardPoints(
  userId: string,
  points: number,
  type: string,
  description: string,
): Promise<void> {
  try {
    await prisma.$transaction([
      (prisma as any).loyaltyPoints.upsert({
        where:  { userId },
        create: { userId, points, lifetime: points > 0 ? points : 0 },
        update: {
          points:   { increment: points },
          lifetime: points > 0 ? { increment: points } : undefined,
        },
      }),
      (prisma as any).pointTransaction.create({
        data: { userId, points, type, description },
      }),
    ]);
  } catch (err) {
    console.error('[awardPoints] Error:', err);
  }
}
