import { createFileRoute, Link } from '@tanstack/react-router'
import { MessageCircle, Shield } from 'lucide-react'
import Logo from '#/components/Logo'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <main className="page-wrap flex min-h-[80vh] flex-col items-center justify-center px-4 py-12 text-center">
      <Logo className="rise-in mx-auto mb-6 h-24 w-auto" />
      <h1 className="rise-in mb-3 text-4xl font-bold tracking-tight text-[var(--mag-ink)]" style={{ animationDelay: '80ms' }}>
        Meet & Greet
      </h1>
      <p className="rise-in mb-8 max-w-sm text-base text-[var(--mag-ink-soft)]" style={{ animationDelay: '160ms' }}>
        Discover meaningful connections. Swipe, match, and chat with people who share your vibe.
      </p>

      <div className="rise-in mb-6 flex items-center gap-6 text-[var(--mag-ink-muted)]" style={{ animationDelay: '240ms' }}>
        <div className="flex flex-col items-center gap-1">
          <Shield className="h-5 w-5" />
          <span className="text-[10px]">Safe</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Logo className="h-8 w-auto" />
          <span className="text-[10px]">Real</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px]">Fun</span>
        </div>
      </div>

      <div className="rise-in flex w-full max-w-xs flex-col gap-3" style={{ animationDelay: '320ms' }}>
        <Link
          to="/login"
          className="flex items-center justify-center rounded-full bg-[var(--mag-ink)] px-6 py-3.5 text-base font-semibold !text-[var(--mag-bg)] transition hover:opacity-80 active:scale-95 no-underline"
        >
          Get started
        </Link>
      </div>

      <p className="rise-in mt-8 text-xs text-[var(--mag-ink-muted)]" style={{ animationDelay: '400ms' }}>
        By continuing, you agree to our{' '}
        <Link to="/terms" className="underline">Terms</Link> and{' '}
        <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </main>
  )
}
