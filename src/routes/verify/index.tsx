import { createFileRoute, Link } from '@tanstack/react-router'
import { Shield, ChevronRight, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/verify/')({ component: VerifyIntroPage })

function VerifyIntroPage() {
  return (
    <main className="page-wrap flex min-h-[80vh] flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mag-surface)]">
        <Shield className="h-10 w-10 text-[var(--mag-ink)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Get Verified</h1>
      <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">
        Verified profiles get more matches. Complete a quick photo pose to earn your blue checkmark.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-3 text-left">
        {[
          'Take a quick selfie following our prompt',
          'We match it to your profile photos',
          'Get a verified badge on your profile',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 rounded-none border border-[var(--mag-line)] bg-[var(--mag-card)] p-3">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--mag-ink)]" />
            <span className="text-sm text-[var(--mag-ink)]">{step}</span>
          </div>
        ))}
      </div>

      <Link
        to="/verify/capture"
        className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[var(--mag-ink)] px-6 py-3 text-sm font-medium text-[var(--mag-bg)] transition hover:opacity-80 active:scale-95 no-underline"
      >
        Start Verification
        <ChevronRight className="h-4 w-4" />
      </Link>
    </main>
  )
}
