import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, LogIn, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { joinEvent } from '#/server/events'

export const Route = createFileRoute('/events/join')({ component: JoinEventPage })

function JoinEventPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setStatus('loading')
    setMessage('')

    try {
      const result = await joinEvent({ data: trimmed })
      if (result.success) {
        setStatus('success')
        setMessage(result.alreadyJoined ? 'You are already in this event!' : 'You are in!')
        setTimeout(() => navigate({ to: '/events' }), 1500)
      } else {
        setStatus('error')
        setMessage(result.message || 'Could not join event.')
      }
    } catch (e) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => navigate({ to: '/events' })} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Join Event</h1>
      </div>

      <div className="mx-auto mb-6 max-w-md">
        <label className="mb-1.5 block text-center text-xs font-medium text-[var(--mag-ink)]">Enter Event Code</label>
        <div className="flex gap-2">
          <input type="text" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); if (status !== 'idle') setStatus('idle') }} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. ARTWALK" maxLength={8}
            disabled={status === 'loading' || status === 'success'}
            className="flex-1 rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-[var(--mag-ink)] uppercase focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20 disabled:opacity-60" />
          <button onClick={handleSubmit} disabled={!code.trim() || status === 'loading' || status === 'success'} className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--mag-green)] text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {status === 'success' && (
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--mag-green)] bg-[var(--mag-green)]/5 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--mag-green)]" />
          <h2 className="text-lg font-bold text-[var(--mag-ink)]">You are in!</h2>
          <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">Redirecting to events…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 shrink-0 text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Could not join</h3>
              <p className="text-xs text-red-500 dark:text-red-400/80">{message}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
