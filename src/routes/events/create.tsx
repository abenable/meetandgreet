import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Calendar, MapPin, Plus } from 'lucide-react'
import { mockEvents, setActiveEvent } from '#/lib/mock-data'

export const Route = createFileRoute('/events/create')({ component: CreateEventPage })

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function CreateEventPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [code] = useState(generateCode())

  const handleCreate = () => {
    if (!name.trim()) return
    const newEvent = {
      id: `e${mockEvents.length + 1}`,
      code,
      name: name.trim(),
      description: description.trim() || 'No description',
      location: location.trim() || 'TBD',
      attendeeIds: ['me'],
      isActive: true,
    }
    mockEvents.push(newEvent)
    setActiveEvent(newEvent.id)
    navigate({ to: '/events' })
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
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Create Event</h1>
      </div>

      {/* Generated Code Display */}
      <div className="mb-6 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-5 text-center card-shadow">
        <p className="text-xs font-medium text-[var(--mag-ink-soft)] uppercase tracking-wide">Event Code</p>
        <p className="mt-2 text-3xl font-mono font-bold tracking-widest text-[var(--mag-green)]">{code}</p>
        <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">Share this code so others can join</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Event Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fremont Friday Night"
            className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this event about?"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Capitol Hill, Seattle"
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!name.trim()}
        className="mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        Create Event
      </button>
    </main>
  )
}
