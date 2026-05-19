import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, X, MapPin } from 'lucide-react'

const mockProfiles = [
  { id: 'p1', name: 'Maya', age: 27, bio: 'Architect by day, pottery enthusiast by night.', photos: ['https://picsum.photos/seed/maya1/400/600'], gender: 'Female', location: 'Seattle, WA', distance: '2 miles away', interests: ['Coffee', 'Hiking', 'Indie Music', 'Pottery'] },
  { id: 'p2', name: 'Jordan', age: 24, bio: 'Dog lover and weekend hiker.', photos: ['https://picsum.photos/seed/jordan1/400/600'], gender: 'Male', location: 'Seattle, WA', distance: '5 miles away', interests: ['Dogs', 'Hiking', 'Coffee', 'Photography'] },
  { id: 'p3', name: 'Alex', age: 26, bio: 'Software engineer who loves climbing and cooking.', photos: ['https://picsum.photos/seed/alex1/400/600'], gender: 'Male', location: 'Seattle, WA', distance: '1 mile away', interests: ['Climbing', 'Cooking', 'Ramen', 'Gaming'] },
]

const categoryInterestMap: Record<string, string[]> = {
  Foodies: ['Food', 'Cooking', 'Wine', 'Baking', 'Coffee', 'Farmers Markets'],
  Bookworms: ['Reading', 'Writing', 'Fantasy'],
  Musicians: ['Music', 'Guitar', 'Jazz', 'Dance', 'Salsa', 'Performing', 'Live Music'],
  Travelers: ['Travel', 'Van Life', 'Adventure', 'Kayaking', 'Camping', 'Nature', 'Hiking'],
  Fitness: ['Fitness', 'Swimming', 'Yoga', 'Running', 'Climbing'],
  Creatives: ['Art', 'Photography', 'Pottery', 'Poetry', 'Writing', 'Performing'],
}

export const Route = createFileRoute('/explore')({ component: ExplorePage })

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  const filteredProfiles = useMemo(() => {
    let result = mockProfiles
    if (activeCategory) {
      const interests = categoryInterestMap[activeCategory] || []
      result = result.filter((p) => p.interests.some((i) => interests.includes(i)))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.interests.some((i) => i.toLowerCase().includes(q)) || p.location.toLowerCase().includes(q))
    }
    return result
  }, [searchQuery, activeCategory])

  const isFiltering = Boolean(searchQuery.trim() || activeCategory)

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Explore</h1>
        <button onClick={() => setShowSearch((s) => !s)} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      </div>

      {showSearch && (
        <div className="mb-4">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search people, interests, or locations..."
            className="w-full rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-ink)] focus:outline-none" />
        </div>
      )}

      {isFiltering && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-[var(--mag-ink-soft)]">{filteredProfiles.length} result{filteredProfiles.length !== 1 ? 's' : ''}</span>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-line)]">
              {activeCategory} <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {filteredProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 text-center text-[var(--mag-ink-muted)] text-sm">No results found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProfiles.map((profile) => (
            <div key={profile.id} className="relative overflow-hidden rounded-2xl bg-[var(--mag-card)]">
              <img src={profile.photos[0]} alt={profile.name} className="aspect-[3/4] w-full object-cover" />
              <div className="gradient-overlay absolute inset-0" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] text-white/80">
                  <MapPin className="h-3 w-3" />{profile.distance}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
