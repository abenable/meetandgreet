import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, Pizza, BookOpen, Music, Plane, Dumbbell, Palette, ChevronRight, X, MapPin } from 'lucide-react'
import { exploreCategories, mockProfiles } from '#/lib/mock-data'

const iconMap: Record<string, React.ReactNode> = {
  pizza: <Pizza className="h-6 w-6" />,
  book: <BookOpen className="h-6 w-6" />,
  music: <Music className="h-6 w-6" />,
  plane: <Plane className="h-6 w-6" />,
  dumbbell: <Dumbbell className="h-6 w-6" />,
  palette: <Palette className="h-6 w-6" />,
}

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
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.interests.some((i) => i.toLowerCase().includes(q)) ||
          p.location.toLowerCase().includes(q)
      )
    }
    return result
  }, [searchQuery, activeCategory])

  const isFiltering = Boolean(searchQuery.trim() || activeCategory)

  return (
    <main className="page-wrap px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Explore</h1>
        <button
          onClick={() => setShowSearch((s) => !s)}
          className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
        >
          {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, interest, or city..."
              className="w-full rounded-full border border-[var(--mag-line)] bg-[var(--input-bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mag-ink-muted)] hover:text-[var(--mag-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Pill */}
      {activeCategory && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-green)] px-3 py-1.5 text-xs font-medium text-white">
            {activeCategory}
            <button onClick={() => setActiveCategory(null)} className="ml-1">
              <X className="h-3 w-3" />
            </button>
          </span>
          <span className="text-xs text-[var(--mag-ink-muted)]">{filteredProfiles.length} results</span>
        </div>
      )}

      {/* Results Grid when filtering */}
      {isFiltering ? (
        <div>
          {filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-[var(--mag-ink-muted)]" />
              <p className="mt-3 text-sm text-[var(--mag-ink-soft)]">No profiles found</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory(null) }}
                className="mt-2 text-xs text-[var(--mag-green)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="overflow-hidden rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] card-shadow"
                >
                  <div className="relative">
                    <img src={profile.photos[0]} alt={profile.name} className="aspect-[3/4] w-full object-cover" />
                    <div className="gradient-overlay absolute inset-0" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/80">
                        <MapPin className="h-3 w-3" />
                        <span>{profile.distance || profile.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {profile.interests.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--mag-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--mag-ink-soft)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Featured Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-[var(--mag-green)] to-[var(--mag-green-light)] p-5 text-white shadow-md">
            <p className="text-xs font-medium opacity-90">Featured</p>
            <h2 className="mt-1 text-lg font-bold">Weekend Getaways</h2>
            <p className="mt-1 text-sm opacity-90">450+ people planning trips near you</p>
            <button
              onClick={() => setActiveCategory('Travelers')}
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/30"
            >
              Explore Now <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Categories */}
          <h2 className="mb-3 text-sm font-semibold text-[var(--mag-ink)]">Categories</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {exploreCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 text-left transition hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {iconMap[cat.icon] || <Search className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--mag-ink)]">{cat.name}</h3>
                  <p className="text-xs text-[var(--mag-ink-muted)]">{cat.count} people nearby</p>
                </div>
              </button>
            ))}
          </div>

          {/* Trending Events */}
          <h2 className="mb-3 mt-6 text-sm font-semibold text-[var(--mag-ink)]">Trending Events</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
            {[
              { title: 'Sunset Yoga', subtitle: 'Pier 62 • Today 6PM', image: 'https://picsum.photos/seed/yoga/300/200' },
              { title: 'Speed Dating', subtitle: 'Downtown • Fri 7PM', image: 'https://picsum.photos/seed/speed/300/200' },
              { title: 'Art Walk', subtitle: 'Capitol Hill • Sat 2PM', image: 'https://picsum.photos/seed/art/300/200' },
            ].map((event) => (
              <div
                key={event.title}
                className="min-w-[240px] flex-shrink-0 overflow-hidden rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] card-shadow"
              >
                <img src={event.image} alt={event.title} className="h-28 w-full object-cover" />
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-[var(--mag-ink)]">{event.title}</h3>
                  <p className="text-xs text-[var(--mag-ink-muted)]">{event.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
