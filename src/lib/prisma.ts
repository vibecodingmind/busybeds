import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Add connection timeout and pool configuration for Supabase
    connection: {
      options: {
        connectionTimeoutMillis: 5000, // 5 seconds
        keepAlives: true,
        keepAlivesIdle: 5,
      },
    },
  });

// Warm up the connection pool
prisma.$connect()
  .then(() => {
    console.log('[Database] Connected successfully to Supabase');
  })
  .catch((err) => {
    console.error('[Database] Connection failed:', err);
  });

// Handle connection errors gracefully
prisma.$on('error', (e) => {
  console.error('[Database] Prisma Client error:', e);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
