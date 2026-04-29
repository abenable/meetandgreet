import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Search, QrCode, CheckCircle2, XCircle } from 'lucide-react'
import { getEventByCode, setActiveEvent } from '#/lib/mock-data'

export const Route = createFileRoute('/events/join')({ component: JoinEventPage })

function JoinEventPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'found' | 'notfound'>('idle')
  const [foundEvent, setFoundEvent] = useState<ReturnType<typeof getEventByCode>>(undefined)

  const handleSearch = () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    const event = getEventByCode(trimmed)
    if (event) {
      setFoundEvent(event)
      setStatus('found')
    } else {
      setStatus('notfound')
    }
  }

  const handleJoin = () => {
    if (foundEvent) {
      setActiveEvent(foundEvent.id)
      navigate({ to: '/events' })
    }
  }

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

      {/* Code Input */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Enter Event Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setStatus('idle')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. ARTWALK"
            maxLength={8}
            className="flex-1 rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-[var(--mag-ink)] uppercase focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
          />
          <button
            onClick={handleSearch}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--mag-green)] text-white transition hover:bg-[var(--mag-green-dark)]"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* QR Placeholder */}
      <div className="mb-6 rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] p-6 text-center">
        <QrCode className="mx-auto mb-2 h-8 w-8 text-[var(--mag-ink-muted)]" />
        <p className="text-sm font-medium text-[var(--mag-ink)]">Scan QR Code</p>
        <p className="mt-1 text-xs text-[var(--mag-ink-soft)]">
          Point your camera at an event QR code to join instantly.
        </p>
      </div>

      {/* Result */}
      {status === 'found' && foundEvent && (
        <div className="rounded-2xl border border-[var(--mag-green)] bg-[var(--mag-green)]/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--mag-green)]" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[var(--mag-ink)]">{foundEvent.name}</h3>
              <p className="text-xs text-[var(--mag-ink-soft)]">{foundEvent.description}</p>
              <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">
                {foundEvent.location} &middot; {foundEvent.attendeeIds.length} attending
              </p>
            </div>
          </div>
          <button
            onClick={handleJoin}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--mag-green)] py-2.5 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
          >
            Join Event
          </button>
        </div>
      )}

      {status === 'notfound' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Event not found</h3>
              <p className="text-xs text-red-500 dark:text-red-400/80">Double-check the code and try again.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
