import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { X, Check, Crown, Zap } from 'lucide-react'

export const Route = createFileRoute('/premium')({ component: PremiumPage })

function PremiumPage() {
  const [billing, setBilling] = useState<'monthly' | '6month' | 'annual'>('monthly')

  const prices: Record<string, Record<string, string>> = {
    free: { monthly: '$0', '6month': '$0', annual: '$0' },
  }

  const features = ['Unlimited Likes', 'See Who Likes You', 'Rewind Last Swipe', 'Super Likes', 'Event Creation', 'Priority Support']

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">All Features Free</h1>
        <Link to="/discover" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline"><X className="h-5 w-5" /></Link>
      </div>

      <div className="mb-6 text-center">
        <Crown className="mx-auto mb-2 h-10 w-10 text-[var(--mag-green)]" />
        <p className="text-sm font-semibold text-[var(--mag-ink)]">Meet & Greet is completely free</p>
        <p className="text-xs text-[var(--mag-ink-soft)]">Enjoy all features without any subscription.</p>
      </div>

      <div className="mb-6 space-y-2">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 rounded-xl bg-[var(--mag-surface)] px-4 py-2.5">
            <Check className="h-4 w-4 text-[var(--mag-green)]" />
            <span className="text-sm text-[var(--mag-ink)]">{feature}</span>
          </div>
        ))}
      </div>

      <Link to="/discover" className="inline-flex w-full items-center justify-center rounded-full bg-[var(--mag-green)] py-3.5 text-sm font-bold !text-white shadow-md transition hover:bg-[var(--mag-green-dark)] no-underline">
        Start Discovering
      </Link>
    </main>
  )
}
