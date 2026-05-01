import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Save,
  Play,
  Square,
  Trash2,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  Link2,
} from 'lucide-react'
import { getEventById, updateEvent, deleteEvent, getEventAttendees } from '#/server/events'
import { getSession } from '#/server/auth'

export const Route = createFileRoute('/events/manage/$eventId')({ component: ManageEventPage })

function ManageEventPage() {
  const { eventId } = useParams({ from: '/events/manage/$eventId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: () => getSession(),
  })

  const {
    data: event,
    isLoading: eventLoading,
    isError: eventError,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventById({ data: eventId }),
  })

  const { data: attendeeProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: () => getEventAttendees({ data: eventId }),
    enabled: !!eventId,
  })

  const attendeeCount = (event as any)?._count?.attendees ?? 0

  // Editable form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [maxAttendees, setMaxAttendees] = useState<string>('')
  const [startsAt, setStartsAt] = useState<string>('')
  const [savedMsg, setSavedMsg] = useState(false)

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (event) {
      setName(event.name ?? '')
      setDescription(event.description ?? '')
      setLocation(event.location ?? '')
      setMaxAttendees(event.maxAttendees != null ? String(event.maxAttendees) : '')
      setStartsAt(
        event.startsAt
          ? new Date(event.startsAt).toISOString().slice(0, 16)
          : ''
      )
    }
  }, [event])

  const isCreator = !!session?.user?.id && (event as any)?.createdById === session.user.id

  const updateMutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2000)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate({ to: '/events' })
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      data: {
        eventId,
        data: {
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
          startsAt: startsAt || undefined,
        },
      },
    })
  }

  const handleToggleActive = () => {
    const nextActive = !event?.isActive
    toggleActiveMutation.mutate({
      data: {
        eventId,
        data: {
          isActive: nextActive,
          endedAt: !nextActive ? new Date().toISOString() : undefined,
        },
      },
    })
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return
    deleteMutation.mutate({ data: eventId })
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/events/join/${(event as any).code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (eventLoading || !event) {
    return (
      <main className="page-wrap px-4 py-4">
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
        </div>
      </main>
    )
  }

  if (eventError || !isCreator) {
    return (
      <main className="page-wrap px-4 py-4">
        <div className="mb-5 flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/events' })}
            className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-[var(--mag-ink)]">Manage Event</h1>
        </div>
        <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--mag-ink)]">You don't have permission to manage this event.</p>
          <button
            onClick={() => navigate({ to: '/events' })}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--mag-green)] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
          >
            Go Back
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-4">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => navigate({ to: '/events' })}
          className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Manage Event</h1>
      </div>

      {/* Event Code */}
      <div className="mb-6 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-5 text-center">
        <p className="text-xs font-medium text-[var(--mag-ink-soft)] uppercase tracking-wide">Event Code</p>
        <p className="mt-2 text-4xl font-mono font-bold tracking-widest text-[var(--mag-ink)]">{(event as any).code}</p>
        <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">Share this code so others can join</p>
        <button
          onClick={handleCopyLink}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--mag-line)] bg-[var(--mag-surface)] px-4 py-2 text-xs font-medium text-[var(--mag-ink)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]"
        >
          <Link2 className="h-3.5 w-3.5" />
          {copied ? 'Copied!' : 'Copy Share Link'}
        </button>
      </div>

      {/* Event Details */}
      <section className="mb-6 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
        <h2 className="mb-3 text-sm font-bold text-[var(--mag-ink)]">Event Details</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Max Attendees</label>
            <input
              type="number"
              min={1}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Start Time</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] py-2.5 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          {savedMsg && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--mag-green)]">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
      </section>

      {/* Event Controls */}
      <section className="mb-6 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
        <h2 className="mb-3 text-sm font-bold text-[var(--mag-ink)]">Event Controls</h2>
        <div className="flex flex-wrap items-center gap-3">
          {event.isActive ? (
            <button
              onClick={handleToggleActive}
              disabled={toggleActiveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="h-3.5 w-3.5" /> Stop Event
            </button>
          ) : (
            <button
              onClick={handleToggleActive}
              disabled={toggleActiveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-3.5 w-3.5" /> Start Event
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-transparent px-5 py-2.5 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Event
          </button>
        </div>
      </section>

      {/* Attendees */}
      <section className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--mag-ink)]">Attendees</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-green)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--mag-green)]">
            <Users className="h-3 w-3" />
            {attendeeCount} total
          </span>
        </div>

        {profilesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
          </div>
        ) : attendeeProfiles.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--mag-ink-muted)]">No attendees yet.</p>
        ) : (
          <div className="space-y-3">
            {attendeeProfiles.map((profile: any) => {
              const photo = profile.photos?.[0]
              return (
                <div
                  key={profile.userId}
                  className="flex items-center gap-3 rounded-xl border border-[var(--mag-line)] bg-[var(--mag-surface)] p-3"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                    {photo ? (
                      <img src={photo} alt={profile.name ?? ''} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[var(--mag-ink-muted)]">
                        {profile.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--mag-ink)]">
                      {profile.name ?? 'Unnamed'}
                    </p>
                    <p className="truncate text-[10px] text-[var(--mag-ink-muted)]">
                      {profile.location ?? 'No location'}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex h-2 w-2 rounded-full bg-[var(--mag-green)]" />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
