import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
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
  MessageCircle,
  Ban,
  UserX,
  Flag,
  ShieldAlert,
  X,
  ImageIcon,
  Eye,
  Lock,
} from 'lucide-react'
import {
  getEventById,
  updateEvent,
  deleteEvent,
  getEventAttendees,
  removeEventAttendee,
  blockEventAttendee,
  unblockEventAttendee,
  getEventBlockedUsers,
  getEventReports,
} from '#/server/events'
import { getSession } from '#/server/auth'
import AvatarImage from '#/components/AvatarImage'
import { uploadImageToR2, maybeDeleteR2Image } from '#/lib/upload'

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

  const { data: reports = [] } = useQuery({
    queryKey: ['event-reports', eventId],
    queryFn: () => getEventReports({ data: eventId }),
    enabled: !!eventId,
  })

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['event-blocked', eventId],
    queryFn: () => getEventBlockedUsers({ data: eventId }),
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
  const [activeTab, setActiveTab] = useState<Tab>('attendees')
  const [eventPhoto, setEventPhoto] = useState<string | null>(null)
  const [eventIsPublic, setEventIsPublic] = useState(true)
  const [photoError, setPhotoError] = useState('')
  const [saveError, setSaveError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    try {
      const key = `events/${eventId}/photo-${crypto.randomUUID()}.jpg`
      const url = await uploadImageToR2(file, key)

      if (eventPhoto?.startsWith('http')) {
        await maybeDeleteR2Image(eventPhoto).catch(() => {})
      }

      setEventPhoto(url)
    } catch {
      setPhotoError('Failed to process image.')
    }
    e.target.value = ''
  }

  useEffect(() => {
    if (event) {
      setName(event.name ?? '')
      setDescription(event.description ?? '')
      setLocation(event.location ?? '')
      setMaxAttendees(event.maxAttendees != null ? String(event.maxAttendees) : '')
      setStartsAt(event.startsAt ? new Date(event.startsAt).toISOString().slice(0, 16) : '')
      setEventPhoto(event.photo ?? null)
      setEventIsPublic((event as any).isPublic ?? true)
    }
  }, [event])

  const isCreator = !!session?.user?.id && (event as any)?.createdById === session.user.id

  const updateMutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setSaveError('')
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2000)
    },
    onError: (err: any) => {
      const message = err?.message || err?.error?.message || 'Failed to save changes.'
      setSaveError(message)
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

  const removeMutation = useMutation({
    mutationFn: removeEventAttendee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  const blockMutation = useMutation({
    mutationFn: blockEventAttendee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event-blocked', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  const unblockMutation = useMutation({
    mutationFn: unblockEventAttendee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-blocked', eventId] })
    },
  })

  const handleSave = () => {
    const startsAtIso = startsAt ? new Date(startsAt + ':00').toISOString() : undefined
    updateMutation.mutate({
      data: {
        eventId,
        data: {
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
          startsAt: startsAtIso,
          photo: eventPhoto,
          isPublic: eventIsPublic,
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

  const handleRemove = (userId: string, name: string) => {
    if (!confirm(`Remove ${name || 'this user'} from the event?`)) return
    removeMutation.mutate({ data: { eventId, userId } })
  }

  const handleBlock = (userId: string, name: string) => {
    const reason = prompt(`Why do you want to block ${name || 'this user'}? (optional)`)
    if (reason === null) return // cancelled
    blockMutation.mutate({ data: { eventId, userId, reason: reason || undefined } })
  }

  const handleUnblock = (userId: string) => {
    if (!confirm('Unblock this user? They will be able to join again.')) return
    unblockMutation.mutate({ data: { eventId, userId } })
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
        <h2 className="mb-3 text-center text-sm font-bold text-[var(--mag-ink)]">Event Details</h2>
        <div className="mx-auto max-w-md space-y-4">
          <div>
            <label className="mb-1.5 block text-center text-xs font-medium text-[var(--mag-ink)]">Event Photo</label>
            <div className="flex justify-center">
              {eventPhoto ? (
                <div className="relative inline-block">
                <img src={eventPhoto} alt="Event" className="h-32 w-32 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (eventPhoto?.startsWith('http')) {
                      maybeDeleteR2Image(eventPhoto).catch(() => {})
                    }
                    setEventPhoto(null)
                  }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]"
              >
                <ImageIcon className="h-6 w-6" />
              </button>
            )}
              <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} className="hidden" />
            </div>
            {photoError && (
              <p className="mt-2 text-center text-xs font-semibold text-red-500">{photoError}</p>
            )}
          </div>

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
            <label className="mb-1.5 block text-center text-xs font-medium text-[var(--mag-ink)]">Visibility</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEventIsPublic(true)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  eventIsPublic
                    ? 'bg-[var(--mag-green)] text-white'
                    : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> Public
              </button>
              <button
                type="button"
                onClick={() => setEventIsPublic(false)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  !eventIsPublic
                    ? 'bg-[var(--mag-ink)] text-white'
                    : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
                }`}
              >
                <Lock className="h-3.5 w-3.5" /> Private
              </button>
            </div>
            <p className="mt-1 text-center text-[10px] text-[var(--mag-ink-muted)]">
              {eventIsPublic
                ? 'Anyone can find this event on the browse page.'
                : 'Only people with the code or link can join.'}
            </p>
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

        {saveError && (
          <p className="mt-2 text-center text-xs font-semibold text-red-500">{saveError}</p>
        )}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] py-2.5 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-1">
        {([
          { key: 'attendees', label: 'Attendees', count: attendeeCount, icon: Users },
          { key: 'reports', label: 'Reports', count: reports.length, icon: Flag },
          { key: 'blocked', label: 'Blocked', count: blockedUsers.length, icon: Ban },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
              activeTab === t.key
                ? 'bg-[var(--mag-green)] text-white'
                : 'text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0 text-[10px]">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <section className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
        {activeTab === 'attendees' && (
          <>
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
                        <AvatarImage src={photo} alt={profile.name ?? ''} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--mag-ink)]">
                          {profile.name ?? 'Unnamed'}
                        </p>
                        <p className="truncate text-[10px] text-[var(--mag-ink-muted)]">
                          {profile.location ?? 'No location'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => navigate({ to: '/chats/$chatId', params: { chatId: `org_${eventId}_${profile.userId}` } })}
                          title="Message"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-green)]/10 text-[var(--mag-green)] transition hover:bg-[var(--mag-green)]/20"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemove(profile.userId, profile.name)}
                          title="Remove"
                          disabled={removeMutation.isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 transition hover:bg-orange-500/20 disabled:opacity-50"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleBlock(profile.userId, profile.name)}
                          title="Block"
                          disabled={blockMutation.isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--mag-ink)]">Reports</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                <ShieldAlert className="h-3 w-3" />
                {reports.length} total
              </span>
            </div>

            {reports.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--mag-ink-muted)]">No reports yet.</p>
            ) : (
              <div className="space-y-3">
                {(reports as any[]).map((report) => (
                    <div key={report.id} className="rounded-xl border border-[var(--mag-line)] bg-[var(--mag-surface)] p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                        <AvatarImage src={(report.reported as any)?.photos?.[0]} alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[var(--mag-ink)]">
                          {(report.reported as any)?.name ?? 'Unknown'} reported by {(report.reporter as any)?.name ?? 'Unknown'}
                        </p>
                        <p className="text-[10px] text-[var(--mag-ink-muted)]" suppressHydrationWarning>
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="rounded-lg bg-[var(--mag-card)] p-2 text-xs text-[var(--mag-ink-soft)]">
                      {report.reason}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleBlock(report.reportedId, (report.reported as any)?.name)}
                        className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-red-600"
                      >
                        <Ban className="h-3 w-3" /> Block user
                      </button>
                      <button
                        onClick={() => navigate({ to: '/chats/$chatId', params: { chatId: `org_${eventId}_${report.reportedId}` } })}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-[10px] font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
                      >
                        <MessageCircle className="h-3 w-3" /> Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'blocked' && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--mag-ink)]">Blocked Users</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                <Ban className="h-3 w-3" />
                {blockedUsers.length} total
              </span>
            </div>

            {blockedUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--mag-ink-muted)]">No blocked users.</p>
            ) : (
              <div className="space-y-3">
                  {(blockedUsers as any[]).map((b) => {
                  const photo = b.profile?.photos?.[0]
                  return (
                    <div key={b.userId} className="flex items-center gap-3 rounded-xl border border-[var(--mag-line)] bg-[var(--mag-surface)] p-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                        <AvatarImage src={photo} alt={b.profile?.name ?? ''} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--mag-ink)]">
                          {b.profile?.name ?? 'Unknown'}
                        </p>
                        <p className="truncate text-[10px] text-[var(--mag-ink-muted)]">
                          {b.reason || 'No reason given'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnblock(b.userId)}
                        disabled={unblockMutation.isPending}
                        className="shrink-0 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-[10px] font-medium text-[var(--mag-ink-soft)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)] disabled:opacity-50"
                      >
                        Unblock
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>


    </main>
  )
}
