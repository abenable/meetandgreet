import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Heart, MapPin, Users, ArrowRight } from 'lucide-react'
import { getMyActiveEvent, getEventProfiles } from '#/server/events'
import { recordSwipe } from '#/server/swipes'

export const Route = createFileRoute('/discover')({ component: DiscoverPage })

interface Profile {
  id: string
  userId: string
  name: string | null
  bio: string | null
  photos: string[]
  location: string | null
  interests: string[]
}

function DiscoverPage() {
  const queryClient = useQueryClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: activeEvent } = useQuery({ queryKey: ['active-event'], queryFn: () => getMyActiveEvent() })
  const eventId = activeEvent?.id ?? ''

  const { data: baseProfiles = [] } = useQuery({
    queryKey: ['event-profiles', eventId],
    queryFn: () => getEventProfiles({ data: eventId }),
    enabled: !!eventId,
  })

  const [pages, setPages] = useState<Profile[][]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({})
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (baseProfiles.length > 0) {
      setPages([baseProfiles.map((p) => ({ ...p, id: p.userId }))])
    }
  }, [baseProfiles])

  const flatProfiles = pages.flat()
  const totalItems = flatProfiles.length

  const loadMore = useCallback(() => {
    if (loadingMore || baseProfiles.length === 0) return
    setLoadingMore(true)
    setTimeout(() => {
      const nextPage = pages.length
      setPages((prev) => [...prev, baseProfiles.map((p) => ({ ...p, id: `${p.userId}_p${nextPage}` }))])
      setLoadingMore(false)
    }, 800)
  }, [loadingMore, pages.length, baseProfiles])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index)
            if (!Number.isNaN(idx)) {
              setCurrentIndex(idx)
              if (idx >= totalItems - 3) loadMore()
            }
          }
        })
      },
      { threshold: 0.6 }
    )
    Array.from(container.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [flatProfiles.length, totalItems, loadMore])

  const swipeMutation = useMutation({
    mutationFn: recordSwipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })

  const handleAction = useCallback((direction: 'like' | 'pass') => {
    const profile = flatProfiles[currentIndex]
    if (profile && eventId) {
      swipeMutation.mutate({ data: { eventId, swipedId: profile.userId, direction } })
    }

    const container = containerRef.current
    if (!container) return
    const next = currentIndex + 1
    if (next < container.children.length) {
      ;(container.children[next] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (next >= totalItems - 3) loadMore()
  }, [currentIndex, eventId, flatProfiles, loadMore, swipeMutation, totalItems])

  const nextPhoto = (profileId: string, max: number) => {
    setPhotoIndices((prev) => ({ ...prev, [profileId]: Math.min((prev[profileId] ?? 0) + 1, max - 1) }))
  }
  const prevPhoto = (profileId: string) => {
    setPhotoIndices((prev) => ({ ...prev, [profileId]: Math.max((prev[profileId] ?? 0) - 1, 0) }))
  }

  if (!activeEvent || baseProfiles.length === 0) {
    return (
      <div className="page-wrap flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Users className="mb-4 h-16 w-16 text-[var(--mag-ink-muted)]" />
        <h2 className="text-xl font-bold text-[var(--mag-ink)]">Join an Event First</h2>
        <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">Discover is only available when you are checked into an event.</p>
        <Link to="/events" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3 text-sm font-bold !text-white no-underline transition hover:bg-[var(--mag-green-dark)]">
          Browse Events <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-112px)] flex-col bg-[var(--mag-bg)]">
      <div className="mx-auto h-full w-[90%]">
        <div ref={containerRef} className="hide-scrollbar relative h-full snap-y snap-mandatory overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          {flatProfiles.map((profile, index) => {
            const photoIdx = photoIndices[profile.id] ?? 0
            const pic = profile.photos[photoIdx] ?? ''
            return (
              <section key={profile.id} data-index={index} className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden">
                <img src={pic} alt={profile.name ?? ''} className="h-full w-full object-cover" loading={index < 3 ? 'eager' : 'lazy'} />
                <div className="gradient-overlay absolute inset-0" />
                <div className="absolute top-4 left-4 right-4 flex gap-1.5">
                  {profile.photos.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
                <button onClick={() => prevPhoto(profile.id)} className="absolute left-0 top-0 h-[40%] w-1/4" aria-label="Previous photo" />
                <button onClick={() => nextPhoto(profile.id, profile.photos.length)} className="absolute right-0 top-0 h-[40%] w-1/4" aria-label="Next photo" />
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-24">
                  <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" /><span>{profile.location}</span></div>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{profile.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.interests.slice(0, 5).map((interest) => (
                      <span key={interest} className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">{interest}</span>
                    ))}
                  </div>
                </div>
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
                  <button onClick={() => handleAction('like')} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm transition hover:scale-110">
                    <Heart className="h-6 w-6 fill-[var(--mag-green)] text-[var(--mag-green)]" />
                  </button>
                  <button onClick={() => handleAction('pass')} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm transition hover:scale-110">
                    <X className="h-6 w-6 text-red-400" strokeWidth={2.5} />
                  </button>
                </div>
              </section>
            )
          })}
          {loadingMore && (
            <div className="flex h-32 shrink-0 items-center justify-center gap-2 text-sm text-[var(--mag-ink-soft)]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />Loading more...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
