import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'
import { TIER_CONFIG, getEffectiveTier } from '#/lib/tiers'

export const activateBoost = createServerFn({ method: 'POST' })
  .handler(async () => {
    const session = await requireSession()
    const now = new Date()

    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionTier: true, subscriptionExpiresAt: true },
      }),
      prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { boostedUntil: true, lastBoostedAt: true },
      }),
    ])

    if (!user || !profile) {
      throw new Error('Profile not found')
    }

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    const intervalDays = TIER_CONFIG[tier].boosts.intervalDays

    if (profile.lastBoostedAt) {
      const msSinceLastBoost = now.getTime() - profile.lastBoostedAt.getTime()
      const daysSinceLastBoost = msSinceLastBoost / (1000 * 60 * 60 * 24)
      if (daysSinceLastBoost < intervalDays) {
        const nextAvailable = new Date(
          profile.lastBoostedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000
        )
        throw new Error(
          `Boost on cooldown. Available again on ${nextAvailable.toLocaleDateString()}`
        )
      }
    }

    const boostedUntil = new Date(now.getTime() + 60 * 60 * 1000)

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { boostedUntil, lastBoostedAt: now },
    })

    return { success: true as const, boostedUntil }
  })

export const isProfileBoosted = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { boostedUntil: true },
    })

    const now = new Date()
    const isBoosted = profile?.boostedUntil ? profile.boostedUntil > now : false

    return { isBoosted, boostedUntil: profile?.boostedUntil ?? undefined }
  })

export const getBoostStatus = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionTier: true, subscriptionExpiresAt: true },
      }),
      prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { boostedUntil: true, lastBoostedAt: true },
      }),
    ])

    if (!user || !profile) {
      throw new Error('Profile not found')
    }

    const now = new Date()
    const isBoosted = profile.boostedUntil ? profile.boostedUntil > now : false
    const boostedUntil = profile.boostedUntil ?? undefined

    const tier = getEffectiveTier(user.subscriptionTier, user.subscriptionExpiresAt)
    const intervalDays = TIER_CONFIG[tier].boosts.intervalDays

    let nextBoostAt: Date | undefined
    if (profile.lastBoostedAt) {
      const cooldownEnd = new Date(
        profile.lastBoostedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000
      )
      if (cooldownEnd > now) {
        nextBoostAt = cooldownEnd
      }
    }

    return { isBoosted, boostedUntil, nextBoostAt }
  })
