import { createFileRoute, Link } from '@tanstack/react-router'
import { Flame, MessageCircle, Shield } from 'lucide-react'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <main className="page-wrap flex min-h-[80vh] flex-col items-center justify-center px-4 py-12 text-center">
      <Flame className="rise-in mb-6 h-16 w-16 fill-[var(--mag-green)] text-[var(--mag-green)]" />
      <h1 className="rise-in mb-3 text-4xl font-bold tracking-tight text-[var(--mag-ink)]" style={{ animationDelay: '80ms' }}>
        Meet & Greet
      </h1>
      <p className="rise-in mb-8 max-w-sm text-base text-[var(--mag-ink-soft)]" style={{ animationDelay: '160ms' }}>
        Discover meaningful connections. Swipe, match, and chat with people who share your vibe.
      </p>

      <div className="rise-in flex w-full max-w-xs flex-col gap-3" style={{ animationDelay: '240ms' }}>
        <Link
          to="/login"
          className="flex items-center justify-center rounded-full bg-[var(--mag-green)] px-6 py-3.5 text-base font-semibold !text-white shadow-md transition hover:bg-[var(--mag-green-dark)] hover:shadow-lg no-underline"
        >
          Get started
        </Link>
      </div>

      <div className="rise-in mt-10 flex items-center gap-6 text-[var(--mag-ink-muted)]" style={{ animationDelay: '320ms' }}>
        <div className="flex flex-col items-center gap-1">
          <Shield className="h-5 w-5" />
          <span className="text-[10px]">Safe</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Flame className="h-5 w-5" />
          <span className="text-[10px]">Real</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px]">Fun</span>
        </div>
      </div>

      <p className="rise-in mt-8 text-xs text-[var(--mag-ink-muted)]" style={{ animationDelay: '400ms' }}>
        By continuing, you agree to our{' '}
        <a href="#" className="underline">Terms</a> and{' '}
        <a href="#" className="underline">Privacy Policy</a>.
      </p>
    </main>
  )
}
