import { createFileRoute } from '@tanstack/react-router'
import { Heart, Shield, Zap, Users } from 'lucide-react'
import Logo from '../components/Logo'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  return (
    <main className="page-wrap mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-[var(--mag-ink)]">
          <Logo className="h-16 w-16" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">About Meet & Greet</h1>
        <p className="mt-2 text-sm text-[var(--mag-ink-soft)]">
          Making connections that matter.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            icon: Users,
            title: 'Discover People',
            desc: 'Browse profiles tailored to your preferences and discover people who share your interests.',
          },
          {
            icon: Zap,
            title: 'Swipe & Match',
            desc: 'Express interest with a simple swipe. When the feeling is mutual, it is a match!',
          },
          {
            icon: Heart,
            title: 'Meaningful Chats',
            desc: 'Break the ice with contextual prompts and start real conversations.',
          },
          {
            icon: Shield,
            title: 'Safety First',
            desc: 'Your safety is our priority. Report, block, and verify with confidence.',
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-4 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-3 md:p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--mag-surface)] text-[var(--mag-ink)]">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--mag-ink)]">{item.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--mag-ink-soft)]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
