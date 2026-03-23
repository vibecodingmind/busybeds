import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log('[Database] Connected successfully');
  })
  .catch((err) => {
    console.error('[Database] Connection failed:', err);
    // Don't exit in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
