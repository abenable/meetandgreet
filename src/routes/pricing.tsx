import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, X, Crown, Zap, Users, Calendar, MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getUserTier } from '#/server/subscriptions'

export const Route = createFileRoute('/pricing')({ component: PricingPage })

const plans = [
  {
    name: 'Free',
    price: 0,
    period: '',
    icon: Users,
    description: 'Get started and explore events.',
    features: [
      { text: 'Join up to 2 active events', included: true },
      { text: '6 swipes per day', included: true },
      { text: '1 boost every 30 days', included: true },
      { text: 'Chat with matches', included: true },
      { text: 'Create your own events', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: 10000,
    period: '/mo',
    icon: Zap,
    description: 'Unlock unlimited discovery.',
    features: [
      { text: 'Unlimited active events', included: true },
      { text: 'Unlimited daily swipes', included: true },
      { text: '1 boost every 7 days', included: true },
      { text: 'Chat with matches', included: true },
      { text: 'Create your own events', included: true },
      { text: 'Priority support', included: false },
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Host',
    price: 25000,
    period: '/mo',
    icon: Crown,
    description: 'For power users & organizers.',
    features: [
      { text: 'Unlimited active events', included: true },
      { text: 'Unlimited daily swipes', included: true },
      { text: '1 boost every day', included: true },
      { text: 'Chat with matches', included: true },
      { text: 'Create your own events', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Go Host',
    popular: false,
  },
]

function PricingPage() {
  const { data: tierData } = useQuery({
    queryKey: ['user-tier'],
    queryFn: () => getUserTier(),
  })

  const currentTier = tierData?.tier ?? 'free'

  return (
    <main className="page-wrap px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Simple, Transparent Pricing</h1>
          <p className="mt-2 text-sm text-[var(--mag-ink-soft)]">
            Choose the plan that fits your social life. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.name.toLowerCase()
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-4 ${
                  plan.popular
                    ? 'border-[var(--mag-ink)] bg-[var(--mag-card)]'
                    : 'border-[var(--mag-line)] bg-[var(--mag-card)]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--mag-ink)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--mag-bg)]">
                    Most Popular
                  </span>
                )}

                <div className="mb-3 flex items-center justify-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${plan.popular ? 'bg-[var(--mag-ink)] text-[var(--mag-bg)]' : 'bg-[var(--mag-surface)] text-[var(--mag-ink)]'}`}>
                    <plan.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--mag-ink)]">{plan.name}</h3>
                </div>

                <div className="mb-1 text-center">
                  <span className="text-2xl font-bold text-[var(--mag-ink)]">UGX {plan.price.toLocaleString('en-UG')}</span>
                  {plan.period && <span className="text-xs text-[var(--mag-ink-muted)]">{plan.period}</span>}
                </div>
                <p className="mb-4 text-center text-xs text-[var(--mag-ink-soft)]">{plan.description}</p>

                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start justify-center gap-2">
                      {feature.included ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--mag-ink)]" />
                      ) : (
                        <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--mag-ink-muted)]" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-[var(--mag-ink-soft)]' : 'text-[var(--mag-ink-muted)]'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <span className="block w-full rounded-full border border-[var(--mag-line)] py-2.5 text-center text-xs font-bold text-[var(--mag-ink-muted)]">
                    Current Plan
                  </span>
                ) : (
                  <Link
                    to="/settings"
                    className={`block w-full rounded-full py-2.5 text-center text-xs font-bold transition no-underline ${
                      plan.popular
                        ? 'bg-[var(--mag-ink)] text-[var(--mag-bg)] hover:opacity-80'
                        : 'border border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink)] hover:bg-[var(--mag-line)]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ / Trust */}
        <div className="mt-8 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Calendar className="mx-auto mb-1 h-5 w-5 text-[var(--mag-ink-soft)]" />
              <p className="text-xs font-semibold text-[var(--mag-ink)]">Cancel Anytime</p>
              <p className="text-[10px] text-[var(--mag-ink-muted)]">No long-term contracts</p>
            </div>
            <div className="text-center">
              <Zap className="mx-auto mb-1 h-5 w-5 text-[var(--mag-ink-soft)]" />
              <p className="text-xs font-semibold text-[var(--mag-ink)]">Instant Upgrade</p>
              <p className="text-[10px] text-[var(--mag-ink-muted)]">Features unlock immediately</p>
            </div>
            <div className="text-center">
              <MessageCircle className="mx-auto mb-1 h-5 w-5 text-[var(--mag-ink-soft)]" />
              <p className="text-xs font-semibold text-[var(--mag-ink)]">24/7 Support</p>
              <p className="text-[10px] text-[var(--mag-ink-muted)]">We're here to help</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
