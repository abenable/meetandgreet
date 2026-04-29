import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { X, Check, Crown, Star, Zap } from 'lucide-react'
import { subscriptionTiers } from '#/lib/mock-data'

export const Route = createFileRoute('/premium')({ component: PremiumPage })

function PremiumPage() {
  const [selectedTier, setSelectedTier] = useState('gold')
  const [billing, setBilling] = useState<'monthly' | '6month' | 'annual'>('monthly')

  const tier = subscriptionTiers.find((t) => t.id === selectedTier) || subscriptionTiers[1]

  const prices: Record<string, Record<string, string>> = {
    plus: { monthly: '$9.99', '6month': '$35.94', annual: '$59.88' },
    gold: { monthly: '$14.99', '6month': '$59.94', annual: '$89.88' },
    platinum: { monthly: '$19.99', '6month': '$89.94', annual: '$119.88' },
  }

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Upgrade</h1>
        <Link to="/discover" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <X className="h-5 w-5" />
        </Link>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {(['monthly', '6month', 'annual'] as const).map((b) => (
          <button
            key={b}
            onClick={() => setBilling(b)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                billing === b ? 'bg-[var(--mag-green)] text-white' : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink)]'
            }`}
          >
            {b === '6month' ? '6 Months' : b === 'annual' ? 'Annual' : 'Monthly'}
          </button>
        ))}
      </div>

      <div className="mb-6 flex justify-center gap-3">
        {subscriptionTiers.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTier(t.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition ${
                selectedTier === t.id
                ? 'border-[var(--mag-green)] bg-[var(--mag-green)]/5 shadow-sm'
                : 'border-[var(--mag-line)] bg-[var(--mag-card)]'
            }`}
          >
            {t.id === 'gold' && <Crown className="h-5 w-5 text-yellow-500" />}
            {t.id === 'platinum' && <Star className="h-5 w-5 text-gray-400" />}
            {t.id === 'plus' && <Zap className="h-5 w-5 text-[var(--mag-green)]" />}
            <span className={`text-xs font-semibold ${selectedTier === t.id ? 'text-[var(--mag-green)]' : 'text-[var(--mag-ink)]'}`}>
              {t.name}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-6 text-center">
        <p className="text-3xl font-bold text-[var(--mag-ink)]">{prices[tier.id][billing]}</p>
        <p className="text-xs text-[var(--mag-ink-muted)]">
          {billing === 'monthly' ? 'per month' : billing === '6month' ? 'billed every 6 months' : 'billed annually'}
        </p>
      </div>

      <div className="mb-6 space-y-2">
        {tier.features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 rounded-xl bg-[var(--mag-surface)] px-4 py-2.5">
            <Check className="h-4 w-4 text-[var(--mag-green)]" />
            <span className="text-sm text-[var(--mag-ink)]">{feature}</span>
          </div>
        ))}
      </div>

      <button className="w-full rounded-full bg-[var(--mag-green)] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--mag-green-dark)]">
        Subscribe to {tier.name}
      </button>

      <p className="mt-3 text-center text-[10px] text-[var(--mag-ink-muted)]">
        Subscriptions auto-renew. Cancel anytime.{' '}
        <a href="#" className="underline">Terms</a> &{' '}
        <a href="#" className="underline">Privacy</a>.
      </p>
    </main>
  )
}
