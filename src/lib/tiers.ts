export type TierName = 'free' | 'pro' | 'host'

export const TIER_CONFIG = {
  free: {
    maxActiveEvents: 2,
    dailySwipes: 6,
    boosts: { intervalDays: 30 },
    canCreateEvents: false,
    priceMonthly: 0,
  },
  pro: {
    maxActiveEvents: Infinity,
    dailySwipes: Infinity,
    boosts: { intervalDays: 7 },
    canCreateEvents: true,
    priceMonthly: 10000,
  },
  host: {
    maxActiveEvents: Infinity,
    dailySwipes: Infinity,
    boosts: { intervalDays: 1 },
    canCreateEvents: true,
    priceMonthly: 25000,
    prioritySupport: true,
  },
} as const

export function getEffectiveTier(
  rawTier: string | null | undefined,
  expiresAt: Date | null | undefined
): TierName {
  const tier = (rawTier ?? 'free') as TierName
  if (tier === 'free') return 'free'
  if (expiresAt && new Date(expiresAt) < new Date()) return 'free'
  return tier
}
