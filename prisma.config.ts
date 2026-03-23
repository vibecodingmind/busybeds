import { PrismaConfig } from '@prisma/client/config'

const config: PrismaConfig = {
  adapter: process.env.DATABASE_URL,
  log: ['query', 'error', 'warn']
}

export default config