import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Plus, ArrowRight, Users, Clock, History, Lock, LogIn } from 'lucide-react'
import { listEvents, getMyActiveEvent, leaveEvent, getMyCreatedEvents, joinEvent } from '#/server/events'
import { getSession } from '#/server/auth'

export const Route = createFileRoute('/events/')({ component: EventsExplorePage })

function EventsExplorePage() {
  const queryClient = useQueryClient()

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => listEvents(),
  })

  const { data: activeEvent } = useQuery({
    queryKey: ['active-event'],
    queryFn: () => getMyActiveEvent(),
  })

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: () => getSession(),
  })

  const { data: myEvents = [] } = useQuery({
    queryKey: ['my-created-events'],
    queryFn: () => getMyCreatedEvents(),
  })

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; eventName: string; code: string; currentEventName: string } | null>(null)
  const [joinCodeModal, setJoinCodeModal] = useState<{ open: boolean; eventName: string } | null>(null)
  const [enteredCode, setEnteredCode] = useState('')
  const [joinError, setJoinError] = useState('')

  const handleCopyShareLink = (code: string) => {
    const link = `${window.location.origin}/events/join/${code}`
    navigator.clipboard.writeText(link)
  }

  const handleLeave = async () => {
    if (!activeEvent) return
    await leaveEvent({ data: activeEvent.id })
    queryClient.invalidateQueries({ queryKey: ['active-event'] })
  }

  const handleJoin = async (code: string, force = false) => {
    setJoinError('')
    const result = await joinEvent({ data: { code, force } })
    if (result.success) {
      setJoinCodeModal(null)
      setConfirmModal(null)
      queryClient.invalidateQueries({ queryKey: ['active-event'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    } else if ((result as any).needsConfirm) {
      setJoinCodeModal(null)
      setJoinError('')
      setConfirmModal({
        open: true,
        eventName: (result as any).eventName,
        code,
        currentEventName: (result as any).currentEvent.name,
      })
    } else {
      setJoinError(result.message || 'Could not join event.')
    }
  }

  const confirmJoin = async () => {
    if (!confirmModal) return
    await handleJoin(confirmModal.code, true)
  }

  const currentEvents = events.filter((e) => e.isActive && !e.endedAt)
  const pastEvents = events.filter((e) => e.endedAt)
  const upcomingEvents = events.filter((e) => !e.isActive && !e.endedAt)

  const attendeeCount = (activeEvent as any)?._count?.attendees ?? 0

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-[var(--mag-ink)]">Explore Events</h1>

      {activeEvent ? (
        <div className="mb-6 rounded-2xl border border-[var(--mag-green)] bg-gradient-to-br from-[var(--mag-green)]/10 to-[var(--mag-green)]/5 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="rounded-full bg-[var(--mag-green)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">Active</span>
              <div className="mt-1 flex items-center gap-3">
                {activeEvent.photo && (
                  <img src={activeEvent.photo} alt={activeEvent.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[var(--mag-ink)]">{activeEvent.name}</h2>
                  <p className="text-xs text-[var(--mag-ink-soft)]">{activeEvent.description}</p>
                </div>
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)]/15 text-[var(--mag-green)]">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3 text-xs text-[var(--mag-ink-soft)]">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{activeEvent.location}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{attendeeCount} people here</span>
            {activeEvent.createdById === session?.user?.id && (
              <span className="rounded bg-[var(--mag-surface)] px-1.5 py-0.5 font-mono font-medium text-[var(--mag-ink)]">{activeEvent.code}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/discover" className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[var(--mag-green)] py-2.5 text-xs font-bold !text-white no-underline transition hover:bg-[var(--mag-green-dark)]">
              Discover People <ArrowRight className="h-3 w-3" />
            </Link>
            <button onClick={handleLeave} className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-4 py-2.5 text-xs font-medium text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">Leave</button>
            {activeEvent.createdById === session?.user?.id && (
              <Link to="/events/manage/$eventId" params={{ eventId: activeEvent.id }} className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-4 py-2.5 text-xs font-medium text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)] no-underline">
                Manage Event
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] p-6 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-[var(--mag-ink-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--mag-ink)]">No Active Event</h2>
          <p className="mt-1 text-xs text-[var(--mag-ink-soft)]">Join an event below to start meeting people nearby.</p>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--mag-ink)]">Current Events</h3>
        <span className="rounded-full bg-[var(--mag-green)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--mag-green)]">Live now</span>
      </div>
      <div className="mb-6 space-y-3">
        {currentEvents.map((event) => {
          const count = (event as any)._count?.attendees ?? 0
          const isJoined = activeEvent?.id === event.id
          return (
            <div key={event.id} className={`rounded-2xl border p-4 transition ${isJoined ? 'border-[var(--mag-green)] bg-[var(--mag-green)]/5' : 'border-[var(--mag-line)] bg-[var(--mag-card)]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 gap-3">
                  {event.photo && (
                    <img src={event.photo} alt={event.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</h4>
                      {isJoined && <span className="shrink-0 rounded-full bg-[var(--mag-green)] px-2 py-0.5 text-[10px] font-bold text-white">Joined</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">{event.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{count} attending</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {!isJoined && (
                    <button
                      onClick={() => { setEnteredCode(''); setJoinError(''); setJoinCodeModal({ open: true, eventName: event.name }) }}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-green)] px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
                    >
                      <LogIn className="h-3 w-3" /> Join
                    </button>
                  )}
                  {event.createdById === session?.user?.id && (
                    <Link to="/events/manage/$eventId" params={{ eventId: event.id }} className="text-[10px] font-medium text-[var(--mag-ink-muted)] no-underline transition hover:text-[var(--mag-ink)]">
                      Manage
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {myEvents.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--mag-ink)]">My Created Events</h3>
          </div>
          <div className="mb-6 space-y-3">
            {myEvents.map((event) => {
              const count = (event as any)._count?.attendees ?? 0
              return (
                <div key={event.id} className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {event.photo && (
                        <img src={event.photo} alt={event.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</h4>
                        <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">{event.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{count} attending</span>
                          <span className="rounded bg-[var(--mag-surface)] px-1.5 py-0.5 font-mono font-medium text-[var(--mag-ink)]">{event.code}</span>
                          {!event.isPublic && (
                            <span className="inline-flex items-center gap-1 rounded bg-[var(--mag-ink)]/10 px-1.5 py-0.5 font-medium text-[var(--mag-ink)]">
                              <Lock className="h-3 w-3" /> Private
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link to="/events/manage/$eventId" params={{ eventId: event.id }} className="shrink-0 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-[10px] font-medium text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)] no-underline">
                      Manage
                    </Link>
                    <button
                      onClick={() => handleCopyShareLink(event.code)}
                      className="shrink-0 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-[10px] font-medium text-[var(--mag-ink-soft)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {upcomingEvents.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--mag-ink)]">Upcoming Events</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--mag-ink-muted)]"><Clock className="h-3 w-3" />Starting soon</span>
          </div>
          <div className="mb-6 space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 opacity-80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    {event.photo && (
                      <img src={event.photo} alt={event.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</h4>
                      <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">{event.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{0} interested</span>
                      </div>
                    </div>
                  </div>
                  {event.createdById === session?.user?.id && (
                    <Link to="/events/manage/$eventId" params={{ eventId: event.id }} className="text-[10px] font-medium text-[var(--mag-ink-muted)] no-underline transition hover:text-[var(--mag-ink)]">
                      Manage
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pastEvents.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--mag-ink)]">History</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--mag-ink-muted)]"><History className="h-3 w-3" />Past events</span>
          </div>
          <div className="mb-6 space-y-3">
            {pastEvents.map((event) => {
              const count = (event as any)._count?.attendees ?? 0
              return (
                <div key={event.id} className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 opacity-70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {event.photo && (
                        <img src={event.photo} alt={event.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</h4>
                          <span className="shrink-0 rounded-full bg-[var(--mag-ink-muted)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--mag-ink-muted)]">Ended</span>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">{event.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{count} attended</span>
                        </div>
                      </div>
                    </div>
                    {event.createdById === session?.user?.id && (
                      <Link to="/events/manage/$eventId" params={{ eventId: event.id }} className="text-[10px] font-medium text-[var(--mag-ink-muted)] no-underline transition hover:text-[var(--mag-ink)]">
                        Manage
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Link to="/events/create" className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] py-4 text-sm font-medium text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)] no-underline">
        <Plus className="h-4 w-4" />Create New Event
      </Link>

      {/* Enter event code modal */}
      {joinCodeModal?.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-[var(--mag-ink)]">Join {joinCodeModal.eventName}</h3>
            <p className="mb-3 text-xs text-[var(--mag-ink-soft)]">Enter the event code to join.</p>
            <input
              type="text"
              value={enteredCode}
              onChange={(e) => { setJoinError(''); setEnteredCode(e.target.value.toUpperCase()) }}
              placeholder="Enter code"
              maxLength={10}
              autoFocus
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-center text-sm font-mono tracking-widest uppercase text-[var(--mag-ink)] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
            {joinError && (
              <p className="mt-2 text-xs font-semibold text-red-500">{joinError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setJoinError(''); setJoinCodeModal(null) }}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const code = enteredCode.trim()
                  if (!code) return
                  handleJoin(code)
                }}
                disabled={!enteredCode.trim()}
                className="flex-1 rounded-full bg-[var(--mag-green)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm leave + join modal */}
      {confirmModal?.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-[var(--mag-ink)]">Leave current event?</h3>
            <p className="mb-3 text-xs text-[var(--mag-ink-soft)]">
              You are already checked into <strong className="text-[var(--mag-ink)]">{confirmModal.currentEventName}</strong>. You can only be in one event at a time.
            </p>
            <p className="mb-3 text-xs text-[var(--mag-ink-soft)]">
              Join <strong className="text-[var(--mag-ink)]">{confirmModal.eventName}</strong> anyway?
            </p>
            {joinError && (
              <p className="mb-3 text-xs font-semibold text-red-500">{joinError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setJoinError(''); setConfirmModal(null) }}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmJoin}
                className="flex-1 rounded-full bg-[var(--mag-green)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
              >
                Switch Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
