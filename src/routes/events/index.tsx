import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Plus, Search, QrCode, ArrowRight, Users, Clock } from 'lucide-react'
import { listEvents, getMyActiveEvent, joinEvent, leaveEvent } from '#/server/events'

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

  const handleJoin = async (eventId: string) => {
    await joinEvent({ data: eventId })
    queryClient.invalidateQueries({ queryKey: ['active-event'] })
  }

  const handleLeave = async () => {
    if (!activeEvent) return
    await leaveEvent({ data: activeEvent.id })
    queryClient.invalidateQueries({ queryKey: ['active-event'] })
  }

  const currentEvents = events.filter((e) => e.isActive)
  const upcomingEvents = events.filter((e) => !e.isActive)

  const attendeeCount = (activeEvent as any)?._count?.attendees ?? 0

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-[var(--mag-ink)]">Explore Events</h1>

      {activeEvent ? (
        <div className="mb-6 rounded-2xl border border-[var(--mag-green)] bg-gradient-to-br from-[var(--mag-green)]/10 to-[var(--mag-green)]/5 p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <span className="rounded-full bg-[var(--mag-green)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">Active</span>
              <h2 className="mt-1 text-lg font-bold text-[var(--mag-ink)]">{activeEvent.name}</h2>
              <p className="text-xs text-[var(--mag-ink-soft)]">{activeEvent.description}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)]/15 text-[var(--mag-green)]">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3 text-xs text-[var(--mag-ink-soft)]">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{activeEvent.location}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{attendeeCount} people here</span>
            <span className="rounded bg-[var(--mag-surface)] px-1.5 py-0.5 font-mono font-medium text-[var(--mag-ink)]">{activeEvent.code}</span>
          </div>
          <div className="flex gap-2">
            <Link to="/discover" className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[var(--mag-green)] py-2.5 text-xs font-bold !text-white no-underline transition hover:bg-[var(--mag-green-dark)]">
              Discover People <ArrowRight className="h-3 w-3" />
            </Link>
            <button onClick={handleLeave} className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-4 py-2.5 text-xs font-medium text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">Leave</button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] p-6 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-[var(--mag-ink-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--mag-ink)]">No Active Event</h2>
          <p className="mt-1 text-xs text-[var(--mag-ink-soft)]">Join an event below to start meeting people nearby.</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link to="/events/join" className="flex items-center gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 transition hover:border-[var(--mag-green)] no-underline card-shadow">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)]/10 text-[var(--mag-green)]"><Search className="h-5 w-5" /></div>
          <div className="min-w-0"><p className="text-sm font-semibold text-[var(--mag-ink)]">Join by Code</p><p className="text-[10px] text-[var(--mag-ink-soft)]">Enter event code</p></div>
        </Link>
        <Link to="/events/join" className="flex items-center gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 transition hover:border-[var(--mag-green)] no-underline card-shadow">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)]/10 text-[var(--mag-green)]"><QrCode className="h-5 w-5" /></div>
          <div className="min-w-0"><p className="text-sm font-semibold text-[var(--mag-ink)]">Scan QR</p><p className="text-[10px] text-[var(--mag-ink-soft)]">Point camera at code</p></div>
        </Link>
      </div>

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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</h4>
                    {isJoined && <span className="shrink-0 rounded-full bg-[var(--mag-green)] px-2 py-0.5 text-[10px] font-bold text-white">Joined</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">{event.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{count} attending</span>
                    <span className="rounded bg-[var(--mag-surface)] px-1.5 py-0.5 font-mono font-medium text-[var(--mag-ink)]">{event.code}</span>
                  </div>
                </div>
                {!isJoined && (
                  <button onClick={() => handleJoin(event.id)} className="shrink-0 rounded-full bg-[var(--mag-green)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--mag-green-dark)]">Join</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

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
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</h4>
                    <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">{event.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{0} interested</span>
                      <span className="rounded bg-[var(--mag-surface)] px-1.5 py-0.5 font-mono font-medium text-[var(--mag-ink)]">{event.code}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Link to="/events/create" className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] py-4 text-sm font-medium text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)] no-underline">
        <Plus className="h-4 w-4" />Create New Event
      </Link>
    </div>
  )
}
