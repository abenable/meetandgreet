import { createFileRoute } from '@tanstack/react-router'
import { Clock, Heart, Star, X } from 'lucide-react'
import { mockProfiles } from '#/lib/mock-data'

export const Route = createFileRoute('/top-picks')({ component: TopPicksPage })

function TopPicksPage() {
  const picks = mockProfiles.slice(0, 6)

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Top Picks</h1>
        <div className="flex items-center gap-1 rounded-full bg-[var(--mag-line)] px-3 py-1 text-xs font-medium text-[var(--mag-ink-soft)]">
          <Clock className="h-3 w-3" />
          Resets in 04:12:30
        </div>
      </div>

      <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">
        Curated profiles selected just for you. Refreshes daily.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {picks.map((profile) => (
          <div key={profile.id} className="overflow-hidden rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] card-shadow">
            <div className="relative">
              <img src={profile.photos[0]} alt={profile.name} className="aspect-[3/4] w-full object-cover" />
              <div className="gradient-overlay absolute inset-0" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.interests.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-around p-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mag-surface)] transition hover:bg-[var(--mag-surface)]">
                <X className="h-4 w-4 text-red-400" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mag-surface)] transition hover:bg-[var(--mag-surface)]">
                <Star className="h-4 w-4 fill-[var(--mag-blue)] text-[var(--mag-blue)]" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mag-surface)] transition hover:bg-[var(--mag-surface)]">
                <Heart className="h-4 w-4 fill-[var(--mag-green)] text-[var(--mag-green)]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
