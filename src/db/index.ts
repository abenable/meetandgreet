import '@tanstack/react-start/server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // Pool defaults have no connection timeout: a stalled Neon connect would
  // hang the request forever, get killed by the Workers runtime, and leave
  // the slot checked out — poisoning the isolate until every later request
  // in it fails instantly. Fail fast instead so slots are always released.
  max: 5,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 20_000,
  statement_timeout: 15_000,
  query_timeout: 15_000,
})

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
