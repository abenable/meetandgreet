import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Calendar, MapPin, Plus, Users } from 'lucide-react'
import { createEvent } from '#/server/events'

export const Route = createFileRoute('/events/create')({ component: CreateEventPage })

function CreateEventPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (!code) return
    const link = `${window.location.origin}/events/join/${code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const [maxAttendees, setMaxAttendees] = useState<number | ''>('')
  const [startsAt, setStartsAt] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      const event = await createEvent({ data: { 
        name: name.trim(), 
        description: description.trim(), 
        location: location.trim(),
        maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
        startsAt: startsAt || undefined,
      } })
      setCode(event.code)
      setTimeout(() => navigate({ to: '/events' }), 1500)
    } catch (e: any) {
      console.error('[Create Event] Failed:', e)
      const message = e?.message || e?.error?.message || 'Failed to create event. Make sure you are logged in.'
      alert(message)
    }
  }

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => navigate({ to: '/events' })} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Create Event</h1>
      </div>

      {code ? (
        <div className="mb-6 rounded-2xl border border-[var(--mag-green)] bg-[var(--mag-green)]/5 p-5 text-center">
          <p className="text-xs font-medium text-[var(--mag-ink-soft)] uppercase tracking-wide">Event Created</p>
          <p className="mt-2 text-3xl font-mono font-bold tracking-widest text-[var(--mag-green)]">{code}</p>
          <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">Share this code or link so others can join</p>
          <button
            onClick={handleCopyLink}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--mag-green)] bg-[var(--mag-green)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
          >
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Event Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fremont Friday Night"
            className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this event about?" rows={3}
            className="w-full resize-none rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Capitol Hill, Seattle"
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Max Attendees (optional)</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
            <input type="number" min={1} max={1000} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value === '' ? '' : Number(e.target.value))} placeholder="No limit"
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Start Time (optional)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
          </div>
        </div>
      </div>

      <button onClick={handleCreate} disabled={!name.trim() || !!code}
        className="mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed">
        <Plus className="h-4 w-4" />Create Event
      </button>
    </main>
  )
}
