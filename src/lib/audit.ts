import prisma from './prisma';

export async function logAudit(
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string
) {
  try {
    await (prisma as any).auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch {
    // Audit logging should never break the main flow
  }
}
