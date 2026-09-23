import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import Logo from '#/components/Logo'
import { cn } from '#/lib/cn'

/**
 * The shell all six auth screens share.
 *
 * Two modes, because the screens are not peers: `destination` is somewhere you
 * arrive (log in, sign up) and carries the brand lockup; `step` is a stage in a
 * flow (verify a code, choose a password) and carries a back control and a
 * position instead. Previously every screen rendered the identical centred
 * lockup, so a step in the reset flow was indistinguishable from the login
 * page — and none of them offered a way back, which strands anyone running the
 * installed PWA, where there is no browser chrome.
 */
export function AuthLayout({
  mode = 'destination',
  title,
  subtitle,
  back,
  step,
  children,
  footer,
}: {
  mode?: 'destination' | 'step'
  title: string
  subtitle?: ReactNode
  /** Where the back control goes. Steps should always provide one. */
  back?: { to: string; search?: Record<string, unknown>; label?: string }
  step?: { current: number; total: number }
  children: ReactNode
  footer?: ReactNode
}) {
  const isStep = mode === 'step'

  return (
    /* 100dvh, top-aligned. The old `min-h-[90vh]` with vertical centring did
       not shrink when the mobile keyboard opened, which pushed the submit
       button off-screen on small phones. */
    <div className="page-wrap flex min-h-[100dvh] flex-col px-4 pt-6 pb-10">
      {(back || step) && (
        <div className="mb-6 flex h-10 items-center justify-between">
          {back ? (
            <Link
              to={back.to}
              search={back.search as never}
              aria-label={back.label ?? 'Go back'}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-canvas-soft hover:text-ink"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : (
            <span />
          )}
          {step && (
            <span className="text-label text-ink-faint tabular-nums">
              Step {step.current} of {step.total}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'mx-auto flex w-full max-w-sm flex-1 flex-col',
          // Destinations breathe; steps start where the back control left off.
          !isStep && 'justify-center',
        )}
      >
        <header className={cn('mb-7', isStep ? 'text-left' : 'text-center')}>
          {!isStep && <Logo className="mx-auto mb-5 h-14 w-auto" />}
          <h1 className={cn('text-ink', isStep ? 'text-h2' : 'text-h1')}>{title}</h1>
          {subtitle && (
            <p className="mt-2 text-body-sm text-ink-muted">{subtitle}</p>
          )}
        </header>

        {children}

        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </div>
  )
}

/** Form-level errors — the ones that belong to the submission rather than to a
 *  single field. Field-level problems go in `Field`'s error slot. */
export function AuthAlert({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className="rounded-media bg-danger-soft px-4 py-3 text-body-sm text-danger"
    >
      {children}
    </div>
  )
}
