import { createServerFn } from "@tanstack/react-start"
import { db } from "../db/index"
import { requireSession } from "./auth"
import { getEffectiveTier } from "../lib/tiers"

const MAX_ADS_PER_DAY = 3
const REWARDED_SWIPES_COUNT = 5

export const getAdConfig = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireSession()
  const tier = await getEffectiveTier(session.user.id)

  return {
    showAds: tier === "free",
    maxDailyAds: MAX_ADS_PER_DAY,
    rewardedSwipes: REWARDED_SWIPES_COUNT,
  }
})

export const getAdStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireSession()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayViews, tier] = await Promise.all([
    db.adView.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
    }),
    getEffectiveTier(session.user.id),
  ])

  return {
    showAds: tier === "free",
    adsWatchedToday: todayViews,
    adsRemainingToday: Math.max(0, MAX_ADS_PER_DAY - todayViews),
    tier,
  }
})

export const canWatchRewardedAd = createServerFn({ method: "GET" })
  .validator((d: { type: string }) => d)
  .handler(async ({ data }) => {
    const session = await requireSession()
    const tier = await getEffectiveTier(session.user.id)

    if (tier !== "free") {
      return { allowed: false, reason: "Ads are removed for Pro and Host users" }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayViews = await db.adView.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
    })

    if (todayViews >= MAX_ADS_PER_DAY) {
      return { allowed: false, reason: "Daily ad limit reached. Try again tomorrow." }
    }

    return { allowed: true }
  })

export const watchRewardedAd = createServerFn({ method: "POST" })
  .validator(
    (d: {
      type: "rewarded_boost" | "rewarded_swipes"
      eventId?: string
    }) => d
  )
  .handler(async ({ data }) => {
    const session = await requireSession()
    const tier = await getEffectiveTier(session.user.id)

    if (tier !== "free") {
      throw new Error("Ads are removed for Pro and Host users")
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayViews = await db.adView.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
    })

    if (todayViews >= MAX_ADS_PER_DAY) {
      throw new Error("Daily ad limit reached")
    }

    // Record the ad view
    const reward =
      data.type === "rewarded_boost"
        ? "1_hour_boost"
        : `${REWARDED_SWIPES_COUNT}_extra_swipes`

    await db.adView.create({
      data: {
        userId: session.user.id,
        type: data.type,
        reward,
      },
    })

    // Grant the reward
    if (data.type === "rewarded_boost") {
      const boostedUntil = new Date(Date.now() + 60 * 60 * 1000)
      await db.profile.updateMany({
        where: { userId: session.user.id },
        data: { boostedUntil, lastBoostedAt: new Date() },
      })
      return { success: true, reward: "1 hour profile boost", boostedUntil }
    }

    if (data.type === "rewarded_swipes" && data.eventId) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      await db.dailySwipeLimit.upsert({
        where: {
          userId_eventId_date: {
            userId: session.user.id,
            eventId: data.eventId,
            date,
          },
        },
        update: { count: { decrement: REWARDED_SWIPES_COUNT } },
        create: {
          userId: session.user.id,
          eventId: data.eventId,
          date,
          count: -REWARDED_SWIPES_COUNT,
        },
      })
      return { success: true, reward: `${REWARDED_SWIPES_COUNT} extra swipes` }
    }

    return { success: true, reward }
  })
