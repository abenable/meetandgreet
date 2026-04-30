import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  LogIn,
  Loader2,
} from 'lucide-react'
import { getEventByCode, joinEvent } from '#/server/events'
import { getSession } from '#/server/auth'

export const Route = createFileRoute('/events/join/$code')({
  component: ShareJoinPage,
})

function ShareJoinPage() {
  const { code } = useParams({ from: '/events/join/$code' })
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: () => getSession(),
  })

  const { data: event } = useQuery({
    queryKey: ['event-by-code', code],
    queryFn: () => getEventByCode({ data: code }),
  })

  useEffect(() => {
    if (!session) return
    if (status !== 'loading') return

    if (!session.user) {
      setStatus('error')
      setMessage('Log in to join this event.')
      return
    }

    if (!event) {
      setStatus('error')
      setMessage('Event not found or not currently open for joining.')
      return
    }

    setStatus('joining')
    joinEvent({ data: code })
      .then((result) => {
        if (result.success) {
          setStatus('success')
          setTimeout(() => navigate({ to: '/events' }), 1800)
        } else {
          setStatus('error')
          setMessage(result.message || 'Could not join event.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [session, event, code, status, navigate])

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => navigate({ to: '/events' })}
          className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Join Event</h1>
      </div>

      {status === 'loading' || status === 'joining' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[var(--mag-green)]" />
          <p className="text-sm text-[var(--mag-ink-soft)]">
            {status === 'joining' ? 'Joining…' : 'Loading…'}
          </p>
        </div>
      ) : status === 'success' ? (
        <div className="rounded-2xl border border-[var(--mag-green)] bg-[var(--mag-green)]/5 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--mag-green)]" />
          <h2 className="text-lg font-bold text-[var(--mag-ink)]">
            You are in!
          </h2>
          <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">
            {event?.name} — redirecting…
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Event preview */}
          {event && (
            <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
              <h2 className="text-base font-bold text-[var(--mag-ink)]">
                {event.name}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">
                {event.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {(event as any)._count?.attendees ?? 0} attending
                </span>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 shrink-0 text-red-500" />
              <div>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Could not join
                </h3>
                <p className="text-xs text-red-500 dark:text-red-400/80">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {!session?.user && (
            <button
              onClick={() =>
                navigate({
                  to: '/login',
                  search: { redirect: `/events/join/${code}` },
                })
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] py-3 text-sm font-bold !text-white transition hover:bg-[var(--mag-green-dark)]"
            >
              <LogIn className="h-4 w-4" />
              Log in to Join
            </button>
          )}

          <button
            onClick={() => navigate({ to: '/events' })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-3 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
          >
            Browse Events
          </button>
        </div>
      )}
    </main>
  )
}
