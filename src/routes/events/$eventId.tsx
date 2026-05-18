import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users, MapPin, Calendar } from 'lucide-react'
import { getEventById } from '#/server/events'

export const Route = createFileRoute('/events/$eventId')({
  component: EventDetailPage,
})

function EventDetailPage() {
  const { eventId } = useParams({ from: '/events/$eventId' })
  const navigate = useNavigate()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventById({ data: eventId }),
  })

  const attendeeCount = (event as any)?._count?.attendees ?? 0

  if (isLoading) {
    return (
      <main className="page-wrap px-4 py-4">
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
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
          <h1 className="text-lg font-bold text-[var(--mag-ink)]">Event Details</h1>
        </div>
        <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--mag-ink)]">Event not found.</p>
        </div>
      </main>
    )
  }

  const hasSponsor = !!(event as any).sponsorName || !!(event as any).sponsorLogo
  const frameUrl = (event as any).sponsorFrameUrl

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => navigate({ to: '/events' })}
          className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Event Details</h1>
      </div>

      {hasSponsor && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] py-3">
          <span className="text-xs font-medium text-[var(--mag-ink-soft)]">Sponsored by</span>
          {(event as any).sponsorLogo ? (
            <img
              src={(event as any).sponsorLogo}
              alt={(event as any).sponsorName || 'Sponsor'}
              className="h-6 max-w-[180px] object-contain"
            />
          ) : (
            <span className="text-xs font-bold text-[var(--mag-ink)]">{(event as any).sponsorName}</span>
          )}
        </div>
      )}

      <div
        className="relative rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4"
        style={
          frameUrl
            ? {
                borderImage: `url('${frameUrl}') 30 stretch`,
                borderWidth: '12px',
              }
            : undefined
        }
      >
        <div className="flex items-start gap-4">
          {event.photo && (
            <img
              src={event.photo}
              alt={event.name}
              className="h-24 w-24 shrink-0 rounded-2xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[var(--mag-ink)]">{event.name}</h2>
            <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">{event.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--mag-ink-soft)]">
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {attendeeCount} attending
          </span>
          {event.startsAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(event.startsAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </main>
  )
}
