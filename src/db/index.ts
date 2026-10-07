import '@tanstack/react-start/server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 20_000,
    statement_timeout: 15_000,
    query_timeout: 15_000,
  })
  return new PrismaClient({ adapter })
}

const requestClient = new AsyncLocalStorage<PrismaClient>()
let standaloneClient: PrismaClient | undefined

export function runWithPrisma<T>(ctx: ExecutionContext, handle: () => Promise<T>): Promise<T> {
  const client = createClient()
  return requestClient.run(client, handle).finally(() => ctx.waitUntil(client.$disconnect()))
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = requestClient.getStore() ?? (standaloneClient ??= createClient())
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export * from '@prisma/client'
