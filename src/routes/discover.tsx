import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Heart, MapPin, Users, ArrowRight, Flag, MessageCircle, Briefcase } from 'lucide-react'
import { getMyActiveEvent, getEventProfiles, reportUser } from '#/server/events'
import { recordSwipe } from '#/server/swipes'
import { sendMessageRequest } from '#/server/requests'
import AvatarImage from '#/components/AvatarImage'
import { VerifiedBadge } from '#/components/VerifiedBadge'

export const Route = createFileRoute('/discover')({ component: DiscoverPage })

const REPORT_REASONS = [
  'Inappropriate behaviour',
  'Fake profile',
  'Harassment',
  'Spam or scam',
  'Other',
]

function formatNameWithGender(name: string | null, gender: string | null): string {
  const initial = gender === 'Male' ? 'M' : gender === 'Female' ? 'F' : ''
  return initial ? `${name || ''}, ${initial}` : (name || '')
}

function DiscoverPage() {
  const queryClient = useQueryClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: activeEvent } = useQuery({ queryKey: ['active-event'], queryFn: () => getMyActiveEvent() })
  const eventId = activeEvent?.id ?? ''

  const [selectedIntent, setSelectedIntent] = useState<'dating' | 'friends' | 'networking' | ''>('')

  const { data: baseProfiles = [] } = useQuery({
    queryKey: ['event-profiles', eventId, selectedIntent],
    queryFn: () => getEventProfiles({ data: { eventId, intent: selectedIntent || undefined } }),
    enabled: !!eventId,
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({})
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set())
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())
  const [requestPendingIds, setRequestPendingIds] = useState<Set<string>>(new Set())

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportCustom, setReportCustom] = useState('')
  const [reportSuccess, setReportSuccess] = useState('')

  const swipeMutation = useMutation({
    mutationFn: recordSwipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })

  const requestMutation = useMutation({
    mutationFn: sendMessageRequest,
    onSuccess: (_, vars) => {
      setRequestedIds((prev) => new Set(prev).add(vars.data.receiverId))
      queryClient.invalidateQueries({ queryKey: ['outgoing-requests'] })
    },
    onSettled: (_, __, vars) => {
      setRequestPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.data.receiverId)
        return next
      })
    },
  })

  const reportMutation = useMutation({
    mutationFn: reportUser,
    onSuccess: (res) => {
      if (res.success) {
        setReportSuccess('Report submitted. The organizer has been notified.')
        setTimeout(() => {
          setReportModalOpen(false)
          setReportSuccess('')
          setReportReason('')
          setReportCustom('')
        }, 1500)
      } else {
        setReportSuccess(res.message || 'Unable to submit report.')
      }
    },
  })

  const handleAction = useCallback((direction: 'like' | 'pass') => {
    const profile = baseProfiles[currentIndex]
    if (!profile || !eventId) return
    if (swipedIds.has(profile.userId)) return

    setSwipedIds((prev) => new Set(prev).add(profile.userId))
    swipeMutation.mutate({ data: { eventId, swipedId: profile.userId, direction } })

    const container = containerRef.current
    if (!container) return
    const next = currentIndex + 1
    if (next < container.children.length) {
      ;(container.children[next] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentIndex, eventId, baseProfiles, swipeMutation, swipedIds])

  const handleRequest = useCallback(() => {
    const profile = baseProfiles[currentIndex]
    if (!profile || !eventId) return
    if (requestedIds.has(profile.userId) || requestPendingIds.has(profile.userId)) return

    setRequestPendingIds((prev) => new Set(prev).add(profile.userId))
    requestMutation.mutate({ data: { eventId, receiverId: profile.userId } })
  }, [currentIndex, eventId, baseProfiles, requestMutation, requestedIds, requestPendingIds])

  const handleReport = () => {
    const profile = baseProfiles[currentIndex]
    if (!profile || !eventId) return
    const reason = reportReason === 'Other' ? reportCustom.trim() : reportReason
    if (!reason) return
    reportMutation.mutate({ data: { eventId, reportedId: profile.userId, reason } })
  }

  const nextPhoto = (profileId: string, max: number) => {
    setPhotoIndices((prev) => ({ ...prev, [profileId]: Math.min((prev[profileId] ?? 0) + 1, max - 1) }))
  }
  const prevPhoto = (profileId: string) => {
    setPhotoIndices((prev) => ({ ...prev, [profileId]: Math.max((prev[profileId] ?? 0) - 1, 0) }))
  }

  const onScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const idx = Math.round(container.scrollTop / container.clientHeight)
    setCurrentIndex(Math.min(idx, baseProfiles.length - 1))
  }, [baseProfiles.length])

  if (!activeEvent) {
    return (
      <div className="page-wrap flex min-h-[90vh] flex-col items-center justify-center px-4 py-16 text-center">
        <Users className="mb-4 h-16 w-16 text-[var(--mag-ink-muted)]" />
        <h2 className="text-xl font-bold text-[var(--mag-ink)]">Join an Event First</h2>
        <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">Discover is only available when you are checked into an event.</p>
        <Link to="/events" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3 text-sm font-bold !text-white no-underline transition hover:bg-[var(--mag-green-dark)]">
          Browse Events <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  if (baseProfiles.length === 0) {
    return (
      <div className="page-wrap flex min-h-[90vh] flex-col items-center justify-center px-4 py-16 text-center">
        <Users className="mb-4 h-16 w-16 text-[var(--mag-ink-muted)]" />
        <h2 className="text-xl font-bold text-[var(--mag-ink)]">Nobody Here Yet</h2>
        <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">
          Other attendees haven't joined, or you've already swiped through everyone in this event.
        </p>
        <Link to="/events" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3 text-sm font-bold !text-white no-underline transition hover:bg-[var(--mag-green-dark)]">
          Browse More Events <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-112px)] flex-col bg-[var(--mag-bg)]">
      <div className="shrink-0 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {[
            { value: 'dating' as const, label: 'Dating', icon: Heart },
            { value: 'friends' as const, label: 'Friends', icon: Users },
            { value: 'networking' as const, label: 'Networking', icon: Briefcase },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSelectedIntent((prev) => (prev === value ? '' : value))}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedIntent === value
                  ? 'bg-[var(--mag-green)] text-white'
                  : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="hide-scrollbar flex-1 w-full snap-y snap-mandatory overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {baseProfiles.map((profile, index) => {
          const photoIdx = photoIndices[profile.userId] ?? 0
          const pic = profile.photos[photoIdx] ?? ''
          const hasPhotos = profile.photos.length > 0
          return (
            <section
              key={profile.userId}
              data-index={index}
              className="relative h-full w-full shrink-0 snap-start snap-stop overflow-hidden"
            >
              <div className="h-full w-full">
                <AvatarImage src={pic} alt={profile.name ?? ''} />
              </div>
              <div className="gradient-overlay absolute inset-0" />
              {hasPhotos && (
                <>
                  <div className="absolute top-4 left-4 right-4 flex gap-1.5">
                    {profile.photos.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => prevPhoto(profile.userId)}
                    className="absolute left-0 top-0 h-[40%] w-1/4"
                    aria-label="Previous photo"
                  />
                  <button
                    onClick={() => nextPhoto(profile.userId, profile.photos.length)}
                    className="absolute right-0 top-0 h-[40%] w-1/4"
                    aria-label="Next photo"
                  />
                </>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-28">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  {formatNameWithGender(profile.name, profile.gender)}
                  {profile.verifiedAt && <VerifiedBadge />}
                </h2>
                {profile.lookingFor && profile.lookingFor.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {profile.lookingFor.map((intent) => (
                      <span
                        key={intent}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm ${
                          intent === 'dating'
                            ? 'bg-pink-500/80'
                            : intent === 'friends'
                              ? 'bg-blue-500/80'
                              : 'bg-amber-500/80'
                        }`}
                      >
                        {intent.charAt(0).toUpperCase() + intent.slice(1)}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{profile.bio}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.interests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-3">
                <button
                  onClick={() => handleAction('like')}
                  disabled={swipedIds.has(profile.userId)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 ${
                    swipedIds.has(profile.userId) ? 'bg-[var(--mag-green)]' : 'bg-black/30'
                  }`}
                >
                  <Heart
                    className={`h-6 w-6 ${
                      swipedIds.has(profile.userId)
                        ? 'fill-white text-white'
                        : 'fill-transparent text-[var(--mag-green)]'
                    }`}
                  />
                </button>
                <button
                  onClick={handleRequest}
                  disabled={requestedIds.has(profile.userId) || requestPendingIds.has(profile.userId)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 ${
                    requestedIds.has(profile.userId) ? 'bg-blue-500' : 'bg-black/30'
                  }`}
                  title={requestedIds.has(profile.userId) ? 'Request sent' : 'Send message request'}
                >
                  {requestPendingIds.has(profile.userId) ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  ) : (
                    <MessageCircle
                      className={`h-6 w-6 ${
                        requestedIds.has(profile.userId)
                          ? 'fill-white text-white'
                          : 'fill-transparent text-blue-400'
                      }`}
                    />
                  )}
                </button>
                <button
                  onClick={() => handleAction('pass')}
                  disabled={swipedIds.has(profile.userId)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 ${
                    swipedIds.has(profile.userId) ? 'bg-red-500' : 'bg-black/30'
                  }`}
                >
                  <X
                    className={`h-6 w-6 ${
                      swipedIds.has(profile.userId) ? 'text-white' : 'text-red-400'
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
                <button
                  onClick={() => {
                    setReportModalOpen(true)
                    setReportReason('')
                    setReportCustom('')
                    setReportSuccess('')
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm transition hover:scale-110"
                  title="Report user"
                >
                  <Flag className="h-4 w-4 text-yellow-400" />
                </button>
              </div>
            </section>
          )
        })}
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 pb-20 sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-[var(--mag-ink)]">Report user</h3>
            <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">
              This will be sent to the event organizer. Be honest — false reports may result in action against you.
            </p>

            {reportSuccess ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-600 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                {reportSuccess}
              </div>
            ) : (
              <>
                <div className="mb-3 space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--mag-line)] bg-[var(--mag-surface)] px-3 py-2 transition hover:border-[var(--mag-green)]/30"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r}
                        checked={reportReason === r}
                        onChange={() => setReportReason(r)}
                        className="h-4 w-4 accent-[var(--mag-green)]"
                      />
                      <span className="text-sm text-[var(--mag-ink)]">{r}</span>
                    </label>
                  ))}
                </div>

                {reportReason === 'Other' && (
                  <textarea
                    value={reportCustom}
                    onChange={(e) => setReportCustom(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="mb-3 w-full resize-none rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setReportModalOpen(false)}
                    className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={
                      !reportReason || (reportReason === 'Other' && !reportCustom.trim()) || reportMutation.isPending
                    }
                    className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {reportMutation.isPending ? 'Submitting…' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
