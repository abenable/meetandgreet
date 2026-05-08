import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, MapPin, ListOrdered, Loader2 } from 'lucide-react'
import { getEventById, getEventWaitlist, removeFromWaitlist } from '#/server/events'
import AvatarImage from '#/components/AvatarImage'

export const Route = createFileRoute('/events/waitlist/$eventId')({
  component: WaitlistRoomPage,
})

function WaitlistRoomPage() {
  const { eventId } = useParams({ from: '/events/waitlist/$eventId' })
  const navigate = useNavigate()

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventById({ data: eventId }),
  })

  const { data: waitlist = [], isLoading: waitlistLoading } = useQuery({
    queryKey: ['event-waitlist', eventId],
    queryFn: () => getEventWaitlist({ data: eventId }),
    enabled: !!eventId,
  })

  const handleLeave = async () => {
    await removeFromWaitlist({ data: { eventId } })
    navigate({ to: '/events' })
  }

  const isStarted = event && (!event.startsAt || new Date(event.startsAt) <= new Date())

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => navigate({ to: '/events' })}
          className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Waiting Room</h1>
      </div>

      {eventLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--mag-green)]" />
        </div>
      ) : !event ? (
        <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-6 text-center">
          <p className="text-sm text-[var(--mag-ink-soft)]">Event not found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Event info */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-900/10">
            <div className="flex items-start gap-3">
              {event.photo && (
                <img src={event.photo} alt={event.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--mag-ink)]">{event.name}</h2>
                  <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white">Waitlisted</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--mag-ink-soft)]">{event.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                  {event.startsAt && (
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Starts {new Date(event.startsAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
            {isStarted ? (
              <p className="mt-3 text-center text-xs font-semibold text-[var(--mag-green)]">
                The event has started — you should be added automatically. Pull down to refresh.
              </p>
            ) : (
              <p className="mt-3 text-center text-xs text-[var(--mag-ink-soft)]">
                You will automatically join when the event starts.
              </p>
            )}
            <button
              onClick={handleLeave}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full border border-amber-300 bg-white py-2.5 text-xs font-bold text-amber-600 transition hover:bg-amber-100 dark:bg-transparent dark:hover:bg-amber-900/20"
            >
              Leave Waitlist
            </button>
          </div>

          {/* Waitlist */}
          <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--mag-ink)]">People Waiting</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--mag-ink-muted)]">
                <ListOrdered className="h-3 w-3" />
                {waitlist.length} total
              </span>
            </div>

            {waitlistLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--mag-green)]" />
              </div>
            ) : waitlist.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--mag-ink-muted)]">Nobody else is waiting yet.</p>
            ) : (
              <div className="space-y-3">
                {waitlist.map((person: any, index: number) => (
                  <div
                    key={person.userId}
                    className="flex items-center gap-3 rounded-xl border border-[var(--mag-line)] bg-[var(--mag-surface)] p-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--mag-line)] text-[10px] font-bold text-[var(--mag-ink-muted)]">
                      {index + 1}
                    </div>
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                      <AvatarImage src={person.photo} alt={person.name ?? ''} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--mag-ink)]">
                        {person.name ?? 'Unnamed'}
                      </p>
                      <p className="truncate text-[10px] text-[var(--mag-ink-muted)]">
                        Joined waitlist {new Date(person.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
