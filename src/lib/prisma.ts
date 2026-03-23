import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

// Warm up the connection pool
prisma.$connect()
  .then(() => {
    console.log('[Database] Connected successfully to Supabase');
  })
  .catch((err) => {
    console.error('[Database] Connection failed:', err);
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;