import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Phone,
  BookOpen,
  HeartHandshake,
  MessageCircleWarning,
} from 'lucide-react'

export const Route = createFileRoute('/safety')({ component: SafetyPage })

function SafetyPage() {
  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/settings/privacy" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Safety Center</h1>
      </div>

      <div className="mb-6 rounded-none bg-[var(--mag-ink)] p-5 text-[var(--mag-bg)]">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-lg font-bold">Your safety matters</h2>
        </div>
        <p className="mt-1 text-xs opacity-90">
          We are committed to fostering a respectful community. Here is how to stay safe while meeting new people.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: AlertTriangle,
            title: 'Report Suspicious Behavior',
            desc: 'If someone makes you uncomfortable, report them directly from their profile or chat.',
          },
          {
            icon: MessageCircleWarning,
            title: 'Avoid Sharing Personal Info',
            desc: 'Do not share your address, financial details, or passwords with matches.',
          },
          {
            icon: HeartHandshake,
            title: 'Meet in Public First',
            desc: 'Always meet in a public place and tell a friend where you are going.',
          },
          {
            icon: Phone,
            title: 'Emergency Contacts',
            desc: 'Keep emergency numbers handy. In the US, dial 911 for immediate help.',
          },
          {
            icon: BookOpen,
            title: 'Community Guidelines',
            desc: 'Review our guidelines to understand what behavior is expected on Meet & Greet.',
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 rounded-none border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-none bg-[var(--mag-surface)] text-[var(--mag-ink)]">
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
