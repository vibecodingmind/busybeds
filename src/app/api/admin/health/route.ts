export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const start = Date.now();

  // DB health check
  let dbStatus = 'healthy';
  let dbLatency = 0;
  try {
    const t = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - t;
  } catch {
    dbStatus = 'error';
  }

  // Count active sessions (proxy: recent users)
  const recentlyActive = await prisma.user.count({
    where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  }).catch(() => 0);

  const envChecks = {
    database: !!process.env.DATABASE_URL,
    jwt: !!process.env.JWT_SECRET,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    paypal: !!process.env.PAYPAL_CLIENT_ID,
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
    googleOAuth: !!process.env.GOOGLE_CLIENT_ID,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  };

  return NextResponse.json({
    status: dbStatus === 'healthy' ? 'operational' : 'degraded',
    dbStatus,
    dbLatency,
    responseTime: Date.now() - start,
    recentlyActiveUsers: recentlyActive,
    envChecks,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
}
