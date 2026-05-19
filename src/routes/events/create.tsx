import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, MapPin, Plus, Users, X, ImageIcon, Eye, EyeOff, Sparkles } from 'lucide-react'
import { createEvent, getMyActiveEvent } from '#/server/events'
import { localDatetimeToUTCISO } from '#/lib/datetime'

export const Route = createFileRoute('/events/create')({ component: CreateEventPage })

function resizeImageToBase64(file: File, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function CreateEventPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [mysteryMode, setMysteryMode] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [createError, setCreateError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; currentEventName: string } | null>(null)

  const { data: activeEvent } = useQuery({
    queryKey: ['active-event'],
    queryFn: () => getMyActiveEvent(),
  })

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    try {
      const resized = await resizeImageToBase64(file, 800)
      setPhoto(resized)
    } catch {
      setPhotoError('Failed to process image.')
    }
    e.target.value = ''
  }

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

  const handleCreate = async (force = false) => {
    if (!name.trim()) return
    setCreateError('')
    try {
      const startsAtIso = startsAt ? localDatetimeToUTCISO(startsAt) : undefined
      const result = await createEvent({ data: { 
        name: name.trim(), 
        description: description.trim(), 
        location: location.trim(),
        maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
        startsAt: startsAtIso,
        photo: photo || undefined,
        isPublic,
        mysteryMode,
        force,
      } })

      if ((result as any).needsConfirm) {
        setConfirmModal({
          open: true,
          currentEventName: (result as any).currentEvent.name,
        })
        return
      }

      if ((result as any).success === false) {
        setCreateError((result as any).message || 'Could not create event.')
        return
      }

      if ((result as any).success) {
        setCode((result as any).event.code)
        setTimeout(() => navigate({ to: '/events' }), 1500)
      }
    } catch (e: any) {
      console.error('[Create Event] Failed:', e)
      const message = e?.message || e?.error?.message || 'Failed to create event. Make sure you are logged in.'
      setCreateError(message)
    }
  }

  const confirmCreate = async () => {
    setConfirmModal(null)
    await handleCreate(true)
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
        <div className="mb-6 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 text-center">
          <p className="text-xs font-medium text-[var(--mag-ink-soft)] uppercase tracking-wide">Event Created</p>
          <p className="mt-2 text-3xl font-mono font-bold tracking-widest text-[var(--mag-ink)]">{code}</p>
          <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">Share this code or link so others can join</p>
          <button
            onClick={handleCopyLink}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--mag-ink)] px-4 py-2 text-xs font-bold text-[var(--mag-bg)] transition hover:opacity-80"
          >
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
        </div>
      ) : null}

      <div className="mx-auto max-w-md space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Event Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fremont Friday Night"
            className="w-full rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-ink)] focus:outline-none" />
        </div>

        <div>
          <label className="mb-1.5 block text-center text-xs font-medium text-[var(--mag-ink)]">Event Photo</label>
          <div className="flex justify-center">
            {photo ? (
              <div className="relative inline-block">
              <img src={photo} alt="Event" className="h-32 w-32 rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mag-sale)] text-[var(--mag-bg)]"
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
            <p className="mt-2 text-center text-xs font-semibold text-[var(--mag-sale)]">{photoError}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Visibility</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                isPublic
                  ? 'bg-[var(--mag-ink)] text-[var(--mag-bg)]'
                  : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Public
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                !isPublic
                  ? 'bg-[var(--mag-ink)] text-[var(--mag-bg)]'
                  : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" /> Private
            </button>
          </div>
          <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">
            {isPublic 
              ? 'Anyone can find this event on the browse page.' 
              : 'Only people with the code or link can join.'}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-center text-xs font-medium text-[var(--mag-ink)]">Mystery Mode</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMysteryMode(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                mysteryMode
                  ? 'bg-[var(--mag-ink)] text-[var(--mag-bg)]'
                  : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> On
            </button>
            <button
              type="button"
              onClick={() => setMysteryMode(false)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                !mysteryMode
                  ? 'bg-[var(--mag-ink)] text-[var(--mag-bg)]'
                  : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
              }`}
            >
              Off
            </button>
          </div>
          <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">
            Attendees' photos are blurred until they've exchanged 10 messages
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this event about?" rows={3}
            className="w-full resize-none rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-ink)] focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Capitol Hill, Seattle"
              className="w-full rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-ink)] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Max Attendees (optional)</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
            <input type="number" min={1} max={1000} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value === '' ? '' : Number(e.target.value))} placeholder="No limit"
              className="w-full rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-ink)] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Start Time (optional)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--mag-ink-muted)]" />
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-ink)] focus:outline-none" />
          </div>
        </div>
      </div>

      {createError && (
        <p className="mt-4 text-center text-xs font-semibold text-[var(--mag-sale)]">{createError}</p>
      )}
      <div className="mt-6 flex justify-center">
        <button onClick={() => handleCreate()} disabled={!name.trim() || !!code}
          className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--mag-ink)] py-3.5 text-sm font-bold text-[var(--mag-bg)] transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="h-4 w-4" />Create Event
        </button>
      </div>

      {/* Confirm leave current event modal */}
      {confirmModal?.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 border border-[var(--mag-line)]">
            <h3 className="mb-1 text-base font-bold text-[var(--mag-ink)]">Leave current event?</h3>
            <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">
              You are already checked into <strong className="text-[var(--mag-ink)]">{confirmModal.currentEventName}</strong>. You can only be in one event at a time.
            </p>
            <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">
              Create this event and leave your current one?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreate}
                className="flex-1 rounded-full bg-[var(--mag-ink)] py-2.5 text-sm font-bold text-[var(--mag-bg)] transition hover:opacity-80"
              >
                Leave & Create
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
