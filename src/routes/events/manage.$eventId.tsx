import { Button, SegmentedControl, Sheet } from '#/components/ui'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@heroui/react'
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
  UserX,
  X,
  ImageIcon,
  ListOrdered,
} from 'lucide-react'
import {
  getEventById,
  updateEvent,
  deleteEvent,
  getEventAttendees,
  removeEventAttendee,
  getEventWaitlist,
  removeFromWaitlist,
} from '#/server/events'
import { getSession } from '#/server/auth'
import AvatarImage from '#/components/AvatarImage'
import { VerifiedBadge } from '#/components/VerifiedBadge'
import { uploadImageToR2, maybeDeleteR2Image } from '#/lib/upload'
import { localDatetimeToUTCISO, toDatetimeLocalValue } from '#/lib/datetime'

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

  const { data: waitlist = [], isLoading: waitlistLoading } = useQuery({
    queryKey: ['event-waitlist', eventId],
    queryFn: () => getEventWaitlist({ data: eventId }),
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
  const [activeTab, setActiveTab] = useState<'attendees' | 'waitlist'>('attendees')

  const [eventPhoto, setEventPhoto] = useState<string | null>(null)
  const [eventIsPublic, setEventIsPublic] = useState(true)
  const [photoError, setPhotoError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [confirmAction, setConfirmAction] = useState<
    | { kind: 'delete' }
    | { kind: 'remove'; userId: string; name: string }
    | { kind: 'waitlist'; userId: string; name: string }
    | null
  >(null)
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
      setStartsAt(event.startsAt ? toDatetimeLocalValue(event.startsAt) : '')
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

  const removeWaitlistMutation = useMutation({
    mutationFn: removeFromWaitlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-waitlist', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })


  const CONFIRM_COPY = {
    delete: {
      title: 'Delete this event?',
      description:
        'The event, its attendees and its waitlist are removed. This cannot be undone.',
      action: 'Delete event',
    },
    remove: {
      title: 'Remove from the event?',
      description: 'They stop appearing to other attendees. They can join again with the code.',
      action: 'Remove',
    },
    waitlist: {
      title: 'Remove from the waitlist?',
      description: 'They lose their place and will not be promoted when a space opens.',
      action: 'Remove',
    },
  } as const

  const runConfirmedAction = () => {
    if (!confirmAction) return
    if (confirmAction.kind === 'delete') deleteMutation.mutate({ data: eventId })
    if (confirmAction.kind === 'remove') {
      removeMutation.mutate({ data: { eventId, userId: confirmAction.userId } })
    }
    if (confirmAction.kind === 'waitlist') {
      removeWaitlistMutation.mutate({ data: { eventId, userId: confirmAction.userId } })
    }
    setConfirmAction(null)
  }

  const handleSave = () => {
    const startsAtIso = startsAt ? localDatetimeToUTCISO(startsAt) : undefined
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

  const handleDelete = () => setConfirmAction({ kind: 'delete' })

  const handleCopyLink = () => {
    const link = `${window.location.origin}/events/join/${(event as any).code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleRemove = (userId: string, name: string) =>
    setConfirmAction({ kind: 'remove', userId, name })

  const handleRemoveWaitlist = (userId: string, name: string) =>
    setConfirmAction({ kind: 'waitlist', userId, name })


  if (eventLoading) {
    return (
      <main className="page-wrap px-4 py-4 pb-nav">
        <div className="mb-5 flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/events' })}
            className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-xl font-bold text-[var(--mag-ink)]">Manage Event</h1>
          <span aria-hidden="true" className="w-10 shrink-0" />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-[var(--mag-card)] shadow-sm p-4 text-center space-y-2">
            <Skeleton className="mx-auto h-3 w-24 rounded-lg" />
            <Skeleton className="mx-auto h-10 w-40 rounded-lg" />
            <Skeleton className="mx-auto h-8 w-28 rounded-full" />
          </div>
          <div className="rounded-2xl bg-[var(--mag-card)] shadow-sm p-3 space-y-3">
            <Skeleton className="mx-auto h-5 w-28 rounded-lg" />
            <Skeleton className="h-32 w-32 mx-auto rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-full" />
              <Skeleton className="h-10 flex-1 rounded-full" />
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--mag-card)] shadow-sm p-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
            ))}
          </div>
          <div className="rounded-2xl bg-[var(--mag-card)] shadow-sm p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--mag-surface)] p-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded-lg" />
                  <Skeleton className="h-2.5 w-32 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="page-wrap px-4 py-4">
        <div className="mb-5 flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/events' })}
            className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-xl font-bold text-[var(--mag-ink)]">Manage Event</h1>
          <span aria-hidden="true" className="w-10 shrink-0" />
        </div>
        <div className="rounded-2xl bg-[var(--mag-card)] shadow-sm p-5 text-center">
          <p className="text-base font-semibold text-[var(--mag-ink)]">You don't have permission to manage this event.</p>
          <button
            onClick={() => navigate({ to: '/events' })}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--mag-ink)] px-6 py-2.5 text-sm font-bold text-[var(--on-ink)] transition hover:opacity-80"
          >
            Go Back
          </button>
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
          <h1 className="min-w-0 flex-1 truncate text-center text-xl font-bold text-[var(--mag-ink)]">Manage Event</h1>
          <span aria-hidden="true" className="w-10 shrink-0" />
        </div>
        <div className="rounded-2xl bg-[var(--mag-card)] shadow-sm p-5 text-center">
          <p className="text-base font-semibold text-[var(--mag-ink)]">You don't have permission to manage this event.</p>
          <button
            onClick={() => navigate({ to: '/events' })}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--mag-ink)] px-6 py-2.5 text-sm font-bold text-[var(--on-ink)] transition hover:opacity-80"
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
        <h1 className="min-w-0 flex-1 truncate text-center text-xl font-bold text-[var(--mag-ink)]">Manage Event</h1>
        <span aria-hidden="true" className="w-10 shrink-0" />
      </div>

      {/* Event Code */}
      <div className="mb-6 rounded-2xl bg-[var(--mag-card)] shadow-sm p-4 text-center">
        <p className="text-sm font-medium text-[var(--mag-ink-soft)] uppercase tracking-wide">Event Code</p>
        <p className="mt-2 text-4xl font-mono font-bold tracking-widest text-[var(--mag-ink)]">{(event as any).code}</p>
        <p className="mt-1 text-xs text-[var(--mag-ink-muted)]">Share this code so others can join</p>
        <button
          onClick={handleCopyLink}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--mag-surface)] px-4 py-2 text-sm font-medium text-[var(--mag-ink)] transition hover:border-[var(--mag-ink)] hover:text-[var(--mag-ink)]"
        >
          <Link2 className="h-3.5 w-3.5" />
          {copied ? 'Copied!' : 'Copy Share Link'}
        </button>
      </div>

      {/* Event Details */}
      <section className="mb-6 rounded-2xl bg-[var(--mag-card)] shadow-sm p-3">
        <h2 className="mb-3 text-center text-base font-bold text-[var(--mag-ink)]">Event Details</h2>
        <div className="mx-auto max-w-md space-y-4">
          <div>
            <label className="mb-1.5 block text-center text-sm font-medium text-[var(--mag-ink)]">Event Photo</label>
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
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mag-sale)] text-[var(--on-ink)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-ink)] hover:text-[var(--mag-ink)]"
              >
                <ImageIcon className="h-6 w-6" />
              </button>
            )}
              <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} className="hidden" />
            </div>
            {photoError && (
              <p className="mt-2 text-center text-sm font-semibold text-[var(--mag-sale)]">{photoError}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--mag-ink)]">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--mag-ink)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--mag-ink)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-card bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--mag-ink)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--mag-ink)]">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-10 pr-4 text-base text-[var(--mag-ink)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--mag-ink)]">Max Attendees</label>
            <input
              type="number"
              min={1}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-full bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--mag-ink)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
            />
          </div>

          <div>
            <label className="mb-2 block text-center text-sm font-medium text-[var(--mag-ink)]">Visibility</label>
            <SegmentedControl
              aria-label="Event visibility"
              value={eventIsPublic ? 'public' : 'private'}
              onChange={(v) => setEventIsPublic(v === 'public')}
              segments={[
                { value: 'public', label: 'Public' },
                { value: 'private', label: 'Private' },
              ]}
            />
            <p className="mt-1 text-center text-xs text-[var(--mag-ink-muted)]">
              {eventIsPublic
                ? 'Anyone can find this event on the browse page.'
                : 'Only people with the code or link can join.'}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--mag-ink)]">Start Time</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-10 pr-4 text-base text-[var(--mag-ink)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
              />
            </div>
          </div>
        </div>

        {saveError && (
          <p className="mt-2 text-center text-sm font-semibold text-[var(--mag-sale)]">{saveError}</p>
        )}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--mag-ink)] py-2.5 text-sm font-bold text-[var(--on-ink)] transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          {savedMsg && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--mag-ink)]">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
      </section>

      {/* Event Controls */}
      <section className="mb-6 rounded-2xl bg-[var(--mag-card)] shadow-sm p-3">
        <h2 className="mb-3 text-base font-bold text-[var(--mag-ink)]">Event Controls</h2>
        <div className="flex flex-wrap items-center gap-3">
          {event.isActive ? (
            <button
              onClick={handleToggleActive}
              disabled={toggleActiveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--mag-sale)] px-5 py-2.5 text-sm font-bold text-[var(--on-ink)] transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="h-3.5 w-3.5" /> Stop Event
            </button>
          ) : (
            <button
              onClick={handleToggleActive}
              disabled={toggleActiveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--mag-ink)] px-5 py-2.5 text-sm font-bold text-[var(--on-ink)] transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-3.5 w-3.5" /> Start Event
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--mag-sale)]/30 bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--mag-sale)] transition hover:bg-[var(--mag-sale-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Event
          </button>
        </div>
      </section>


      <SegmentedControl
        aria-label="Event management sections"
        className="mb-4"
        value={activeTab}
        onChange={setActiveTab}
        segments={[
          { value: 'attendees', label: 'Attendees', count: attendeeCount },
          { value: 'waitlist', label: 'Waitlist', count: waitlist.length },
        ]}
      />

      {/* Tab Content */}
      <section className="rounded-2xl bg-[var(--mag-card)] shadow-sm p-3">
        {activeTab === 'attendees' && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--mag-ink)]">Attendees</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--mag-ink)]">
                <Users className="h-3 w-3" />
                {attendeeCount} total
              </span>
            </div>

            {profilesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--mag-surface)] p-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24 rounded-lg" />
                      <Skeleton className="h-2.5 w-32 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            ) : attendeeProfiles.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--mag-ink-muted)]">No attendees yet.</p>
            ) : (
              <div className="space-y-3">
                {attendeeProfiles.map((profile: any) => {
                  const photo = profile.photos?.[0]
                  return (
                    <div
                      key={profile.userId}
                      className="flex items-center gap-3 rounded-2xl bg-[var(--mag-surface)] p-3"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                        <AvatarImage src={photo} alt={profile.name ?? ''} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium text-[var(--mag-ink)] flex items-center gap-1.5">
                          {profile.name ?? 'Unnamed'}
                          {profile.verifiedAt && <VerifiedBadge />}
                        </p>
                        <p className="truncate text-xs text-[var(--mag-ink-muted)]">
                          {profile.location ?? 'No location'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => navigate({ to: '/chats/$chatId', params: { chatId: `org_${eventId}_${profile.userId}` } })}
                          title="Message"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink)] transition hover:bg-[var(--mag-line)]"
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
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}


        {activeTab === 'waitlist' && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--mag-ink)]">Waitlist</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--mag-ink)]">
                <ListOrdered className="h-3 w-3" />
                {waitlist.length} waiting
              </span>
            </div>

            {waitlistLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--mag-surface)] p-3">
                    <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24 rounded-lg" />
                      <Skeleton className="h-2.5 w-32 rounded-lg" />
                    </div>
                    <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            ) : waitlist.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--mag-ink-muted)]">No one on the waitlist yet.</p>
            ) : (
              <div className="space-y-3">
                {waitlist.map((person: any, index: number) => (
                  <div
                    key={person.userId}
                    className="flex items-center gap-3 rounded-2xl bg-[var(--mag-surface)] p-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--mag-line)] text-xs font-bold text-[var(--mag-ink-muted)]">
                      {index + 1}
                    </div>
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                      <AvatarImage src={person.photo} alt={person.name ?? ''} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-[var(--mag-ink)]">
                        {person.name ?? 'Unnamed'}
                      </p>
                      <p className="truncate text-xs text-[var(--mag-ink-muted)]">
                        Joined waitlist {new Date(person.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveWaitlist(person.userId, person.name)}
                      disabled={removeWaitlistMutation.isPending}
                      className="shrink-0 rounded-full bg-[var(--mag-ink)] shadow-sm px-3 py-1.5 text-xs font-medium text-[var(--on-ink)] transition hover:border-[var(--mag-sale)]/30 hover:text-[var(--mag-sale)] disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}


      </section>



      <Sheet
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction ? CONFIRM_COPY[confirmAction.kind].title : ''}
        description={
          confirmAction
            ? confirmAction.kind === 'delete'
              ? CONFIRM_COPY.delete.description
              : `${(confirmAction as { name: string }).name || 'This person'} — ${CONFIRM_COPY[confirmAction.kind].description}`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" block onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button variant="danger" block onClick={runConfirmedAction}>
              {confirmAction ? CONFIRM_COPY[confirmAction.kind].action : ''}
            </Button>
          </>
        }
      />
    </main>
  )
}
