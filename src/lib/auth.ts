import '@tanstack/react-start/server-only'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '#/db'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  basePath: '/api/auth',
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const user = await prisma.user.findUnique({
            where: { id: (session as any).userId },
            select: { disabledAt: true },
          })
          if (user?.disabledAt) {
            return false
          }
        },
      },
    },
    user: {
      create: {
        async before(userData) {
          const existing = await prisma.user.findUnique({
            where: { email: (userData as any).email },
            select: { disabledAt: true },
          })
          if (existing?.disabledAt) {
            return false
          }
        },
      },
    },
  },
  plugins: [tanstackStartCookies()],
})
