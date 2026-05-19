import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireSession, requireAdmin } from '#/server/auth'
import { TIER_CONFIG, getEffectiveTier, type TierName } from '#/lib/tiers'

function startOfDay(d: Date): Date {
  const result = new Date(d)
  result.setHours(0, 0, 0, 0)
  return result
}

export const getUserTier = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    })
    if (!user) throw new Error('User not found')

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    const limits = TIER_CONFIG[tier]

    return {
      tier,
      expiresAt: user.subscriptionExpiresAt,
      limits,
    }
  })

export const hasActiveTier = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      tierName: z.enum(['free', 'pro', 'host']),
    })
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        role: true,
      },
    })
    if (!user) return false

    if (user.role === 'admin') return true

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    const tiers: TierName[] = ['free', 'pro', 'host']
    const targetIndex = tiers.indexOf(data.tierName)
    const currentIndex = tiers.indexOf(tier)
    return currentIndex >= targetIndex
  })

export const setUserTier = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string().optional(),
      tier: z.enum(['free', 'pro', 'host']),
      durationMonths: z.number().int().min(1).max(120).default(1),
    })
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const session = await requireSession()
    const targetUserId = data.userId || session.user.id

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + data.durationMonths)

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        subscriptionTier: data.tier,
        subscriptionExpiresAt: expiresAt,
      },
    })

    return { success: true, tier: data.tier, expiresAt }
  })

export const canJoinEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: _eventId }) => {
    const session = await requireSession()

    if (session.user.role === 'admin') {
      return { allowed: true }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    })
    if (!user) {
      return { allowed: false, error: 'User not found' }
    }

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    const limits = TIER_CONFIG[tier]

    if (limits.maxActiveEvents === Infinity) {
      return { allowed: true }
    }

    const activeEventsCount = await prisma.eventAttendee.count({
      where: { userId: session.user.id, leftAt: null },
    })

    if (activeEventsCount >= limits.maxActiveEvents) {
      return { allowed: false, error: 'Free users can only join 2 active events' }
    }

    return { allowed: true }
  })

export const canSwipeToday = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()

    if (session.user.role === 'admin') {
      return { allowed: true }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    })
    if (!user) {
      return { allowed: false, error: 'User not found' }
    }

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    const limits = TIER_CONFIG[tier]

    if (limits.dailySwipes === Infinity) {
      return { allowed: true }
    }

    const today = startOfDay(new Date())

    const record = await prisma.dailySwipeLimit.findUnique({
      where: {
        userId_eventId_date: {
          userId: session.user.id,
          eventId,
          date: today,
        },
      },
    })

    const count = record?.count ?? 0
    if (count >= limits.dailySwipes) {
      return { allowed: false, error: 'Daily swipe limit reached. Upgrade to Pro.' }
    }

    await prisma.dailySwipeLimit.upsert({
      where: {
        userId_eventId_date: {
          userId: session.user.id,
          eventId,
          date: today,
        },
      },
      update: { count: { increment: 1 } },
      create: {
        userId: session.user.id,
        eventId,
        date: today,
        count: 1,
      },
    })

    return { allowed: true }
  })

export const canCreateEvent = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    if (session.user.role === 'admin') {
      return { allowed: true }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    })
    if (!user) {
      return { allowed: false, error: 'User not found' }
    }

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    const limits = TIER_CONFIG[tier]

    if (!limits.canCreateEvents) {
      return { allowed: false, error: 'Upgrade to Pro or Host to create events' }
    }

    return { allowed: true }
  })

export const getTierLimits = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    })
    if (!user) throw new Error('User not found')

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    return {
      tier,
      limits: TIER_CONFIG[tier],
    }
  })
