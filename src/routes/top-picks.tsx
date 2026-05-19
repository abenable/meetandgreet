import { createFileRoute } from '@tanstack/react-router'
import { Clock, Heart, Star, X } from 'lucide-react'

const picks = [
  { name: 'Sam', photo: 'https://picsum.photos/seed/sam1/400/600', tags: ['Creative', 'Musician'] },
  { name: 'Taylor', photo: 'https://picsum.photos/seed/taylor1/400/600', tags: ['Foodie', 'Traveler'] },
  { name: 'Casey', photo: 'https://picsum.photos/seed/casey1/400/600', tags: ['Adventurer', 'Fitness'] },
]

export const Route = createFileRoute('/top-picks')({ component: TopPicksPage })

function TopPicksPage() {
  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Top Picks</h1>
        <div className="flex items-center gap-1 rounded-full bg-[var(--mag-line)] px-3 py-1 text-xs font-medium text-[var(--mag-ink-soft)]">
          <Clock className="h-3 w-3" />Resets daily
        </div>
      </div>

      <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">Curated profiles selected just for you.</p>

      <div className="grid grid-cols-2 gap-3">
        {picks.map((profile, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)]">
            <div className="relative">
              <img src={profile.photo} alt={profile.name} className="aspect-[3/4] w-full object-cover" />
              <div className="gradient-overlay absolute inset-0" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-around p-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mag-surface)] transition hover:bg-[var(--mag-line)]"><X className="h-4 w-4 text-[var(--mag-ink-soft)]" /></button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mag-surface)] transition hover:bg-[var(--mag-line)]"><Star className="h-4 w-4 text-[var(--mag-ink-soft)]" /></button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mag-ink)] transition hover:opacity-80 active:scale-95"><Heart className="h-4 w-4 text-[var(--mag-bg)]" /></button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
